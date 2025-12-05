/**
 * @fileoverview Central configuration management for Spock GOS
 * @implements URS-006, FS-01, DS Kernel
 */

'use strict';

/**
 * Default configuration values
 */
const DEFAULTS = Object.freeze({
  // Vector space settings
  dimensions: 512,
  numericType: 'float32',  // 'float32' | 'float64'
  vectorGeneration: 'gaussian',  // 'gaussian' | 'bipolar'

  // Paths
  workingFolder: '.spock',
  theoriesPath: '.spock/theories',
  evalSuitePath: 'evalSuite',

  // Logging
  logLevel: 'summary',  // 'silent' | 'summary' | 'full'
  traceEnabled: true,

  // Visualisation
  vizPort: 3000,
  vizHost: 'localhost',

  // Limits
  maxRecursion: 100,
  maxIterations: 1000,
  timeout: 30000,  // ms

  // Planning
  planningEpsilon: 0.05,
  maxPlanningSteps: 100,
  plateauStrategy: 'fail',  // 'fail' | 'random_restart' | 'procedural_fallback'
  candidateLimit: 1000,

  // Random seed (null = use system random)
  randomSeed: null
});

/**
 * Valid values for enumerated options
 */
const VALID_VALUES = {
  numericType: ['int8', 'int16', 'int32', 'uint8', 'uint16', 'uint32', 'float32', 'float64'],
  vectorGeneration: ['gaussian', 'bipolar'],
  logLevel: ['silent', 'summary', 'full'],
  plateauStrategy: ['fail', 'random_restart', 'procedural_fallback']
};

/**
 * Maps numericType to TypedArray constructor
 */
const TYPED_ARRAY_MAP = {
  'int8': Int8Array,
  'int16': Int16Array,
  'int32': Int32Array,
  'uint8': Uint8Array,
  'uint16': Uint16Array,
  'uint32': Uint32Array,
  'float32': Float32Array,
  'float64': Float64Array
};

/**
 * Numeric ranges for integer types (for bipolar generation)
 */
const NUMERIC_RANGES = {
  'int8': { min: -128, max: 127, isSigned: true, isFloat: false },
  'int16': { min: -32768, max: 32767, isSigned: true, isFloat: false },
  'int32': { min: -2147483648, max: 2147483647, isSigned: true, isFloat: false },
  'uint8': { min: 0, max: 255, isSigned: false, isFloat: false },
  'uint16': { min: 0, max: 65535, isSigned: false, isFloat: false },
  'uint32': { min: 0, max: 4294967295, isSigned: false, isFloat: false },
  'float32': { min: -Infinity, max: Infinity, isSigned: true, isFloat: true },
  'float64': { min: -Infinity, max: Infinity, isSigned: true, isFloat: true }
};

/**
 * Current configuration (mutable internally)
 * @type {Object}
 */
let currentConfig = { ...DEFAULTS };

/**
 * Validates a configuration value
 * @param {string} key - Configuration key
 * @param {*} value - Value to validate
 * @throws {Error} If value is invalid
 */
function validateValue(key, value) {
  switch (key) {
    case 'dimensions':
      if (!Number.isInteger(value) || value < 64 || (value & (value - 1)) !== 0) {
        throw new Error(`dimensions must be a power of 2 >= 64, got ${value}`);
      }
      break;

    case 'numericType':
    case 'vectorGeneration':
    case 'logLevel':
    case 'plateauStrategy':
      if (!VALID_VALUES[key].includes(value)) {
        throw new Error(`${key} must be one of: ${VALID_VALUES[key].join(', ')}, got ${value}`);
      }
      break;

    case 'maxRecursion':
    case 'maxIterations':
    case 'timeout':
    case 'maxPlanningSteps':
    case 'candidateLimit':
    case 'vizPort':
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${key} must be a positive integer, got ${value}`);
      }
      break;

    case 'planningEpsilon':
      if (typeof value !== 'number' || value <= 0 || value >= 1) {
        throw new Error(`planningEpsilon must be a number in (0, 1), got ${value}`);
      }
      break;

    case 'traceEnabled':
      if (typeof value !== 'boolean') {
        throw new Error(`traceEnabled must be a boolean, got ${typeof value}`);
      }
      break;

    case 'workingFolder':
    case 'theoriesPath':
    case 'evalSuitePath':
    case 'vizHost':
      if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`${key} must be a non-empty string`);
      }
      break;

    case 'randomSeed':
      if (value !== null && !Number.isInteger(value)) {
        throw new Error(`randomSeed must be null or an integer, got ${value}`);
      }
      break;
  }
}

/**
 * Reads configuration from environment variables
 * @returns {Object} Configuration from environment
 */
function readFromEnvironment() {
  const envConfig = {};

  if (process.env.SPOCK_DIMENSIONS) {
    envConfig.dimensions = parseInt(process.env.SPOCK_DIMENSIONS, 10);
  }
  if (process.env.SPOCK_LOG_LEVEL) {
    envConfig.logLevel = process.env.SPOCK_LOG_LEVEL;
  }
  if (process.env.SPOCK_WORKING_FOLDER) {
    envConfig.workingFolder = process.env.SPOCK_WORKING_FOLDER;
  }
  if (process.env.SPOCK_NUMERIC_TYPE) {
    envConfig.numericType = process.env.SPOCK_NUMERIC_TYPE;
  }
  if (process.env.SPOCK_RANDOM_SEED) {
    envConfig.randomSeed = parseInt(process.env.SPOCK_RANDOM_SEED, 10);
  }

  return envConfig;
}

/**
 * Returns the current configuration (immutable copy)
 * @returns {Readonly<Object>} Frozen configuration object
 */
function getConfig() {
  return Object.freeze({ ...currentConfig });
}

/**
 * Updates configuration with partial overrides
 * @param {Object} partialConfig - Partial configuration to merge
 * @throws {Error} If any value is invalid
 */
function setConfig(partialConfig) {
  if (!partialConfig || typeof partialConfig !== 'object') {
    throw new Error('setConfig requires an object');
  }

  // Validate all values before applying
  for (const [key, value] of Object.entries(partialConfig)) {
    if (!(key in DEFAULTS)) {
      throw new Error(`Unknown configuration key: ${key}`);
    }
    validateValue(key, value);
  }

  // Apply validated changes
  currentConfig = { ...currentConfig, ...partialConfig };
}

/**
 * Resets configuration to defaults (useful for testing)
 */
function resetConfig() {
  currentConfig = { ...DEFAULTS };
}

/**
 * Initializes configuration from environment and optional overrides
 * @param {Object} [overrides] - Optional configuration overrides
 */
function initConfig(overrides = {}) {
  resetConfig();
  const envConfig = readFromEnvironment();
  setConfig({ ...envConfig, ...overrides });
}

/**
 * Gets the TypedArray constructor for the configured numeric type
 * @returns {typeof Int8Array | typeof Int16Array | typeof Int32Array | typeof Uint8Array | typeof Uint16Array | typeof Uint32Array | typeof Float32Array | typeof Float64Array}
 */
function getTypedArrayConstructor() {
  return TYPED_ARRAY_MAP[currentConfig.numericType] || Float32Array;
}

/**
 * Gets numeric range info for the configured type
 * @returns {{min: number, max: number, isSigned: boolean, isFloat: boolean}}
 */
function getNumericRange() {
  return NUMERIC_RANGES[currentConfig.numericType] || NUMERIC_RANGES['float32'];
}

/**
 * Checks if current numeric type is a floating-point type
 * @returns {boolean}
 */
function isFloatType() {
  return getNumericRange().isFloat;
}

module.exports = {
  getConfig,
  setConfig,
  resetConfig,
  initConfig,
  getTypedArrayConstructor,
  getNumericRange,
  isFloatType,
  DEFAULTS,
  TYPED_ARRAY_MAP,
  NUMERIC_RANGES
};
