/**
 * @fileoverview Main public entry point - createSpockEngine
 * @implements URS-006, URS-007, FS-06, DS Kernel
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { initConfig, getConfig, setConfig } = require('../config/config');
const vectorSpace = require('../kernel/vectorSpace');
const primitiveOps = require('../kernel/primitiveOps');
const { createSession: createSessionFn, createTypedValue } = require('../session/sessionManager');
const { loadTheory, listTheories, ensureTheoriesDirectory, seedBuiltinTheories } = require('../theory/theoryStore');

/**
 * Path to persisted Truth vector
 */
const TRUTH_FILENAME = 'truth.bin';

/**
 * Loads or generates the canonical Truth vector
 * @param {string} workingFolder - Working folder path
 * @param {number} dimensions - Vector dimensions
 * @returns {Float32Array|Float64Array} Truth vector
 */
function loadOrGenerateTruth(workingFolder, dimensions) {
  const truthPath = path.join(workingFolder, TRUTH_FILENAME);

  // Try to load existing Truth
  if (fs.existsSync(truthPath)) {
    try {
      const buffer = fs.readFileSync(truthPath);
      const TypedArray = getConfig().numericType === 'float64' ? Float64Array : Float32Array;
      const truth = new TypedArray(buffer.buffer, buffer.byteOffset, dimensions);

      // Verify dimensions match
      if (truth.length === dimensions) {
        return truth;
      }
    } catch (e) {
      // Failed to load, generate new
    }
  }

  // Generate new Truth vector
  const truth = vectorSpace.normalise(vectorSpace.createRandomVector(dimensions));

  // Persist for future runs
  try {
    if (!fs.existsSync(workingFolder)) {
      fs.mkdirSync(workingFolder, { recursive: true });
    }
    const buffer = Buffer.from(truth.buffer);
    fs.writeFileSync(truthPath, buffer);
  } catch (e) {
    // Failed to persist, continue anyway
    console.warn('Could not persist Truth vector:', e.message);
  }

  return truth;
}

/**
 * Creates canonical constants (Truth, False, Zero)
 * @param {number} dimensions - Vector dimensions
 * @param {string} workingFolder - Working folder path
 * @returns {Map<string, Object>} Global symbols map
 */
function createCanonicalConstants(dimensions, workingFolder) {
  const globalSymbols = new Map();

  // Truth: random unit vector, persisted
  const Truth = loadOrGenerateTruth(workingFolder, dimensions);
  globalSymbols.set('Truth', createTypedValue('VECTOR', Truth));

  // False: negation of Truth
  const False = primitiveOps.negate(Truth);
  globalSymbols.set('False', createTypedValue('VECTOR', False));

  // Zero: zero vector
  const Zero = vectorSpace.createVector(dimensions);
  globalSymbols.set('Zero', createTypedValue('VECTOR', Zero));

  return globalSymbols;
}

/**
 * Creates and initializes a Spock engine instance
 * @param {Object} [options={}] - Configuration options
 * @param {string} [options.workingFolder='.spock'] - Working folder path
 * @param {number} [options.dimensions=512] - Vector dimensions
 * @param {Array<string>} [options.defaultTheories=[]] - Theories to preload
 * @param {string} [options.logLevel='summary'] - Logging level
 * @param {number|null} [options.randomSeed=null] - Random seed for reproducibility
 * @returns {Object} SpockEngine instance
 */
function createSpockEngine(options = {}) {
  // Initialize configuration
  initConfig(options);
  const config = getConfig();

  // Always apply randomSeed from config (either from options or config default)
  // This ensures reproducibility when seed is set anywhere
  vectorSpace.setRandomSeed(config.randomSeed);

  // Ensure working folder exists
  if (!fs.existsSync(config.workingFolder)) {
    fs.mkdirSync(config.workingFolder, { recursive: true });
  }

  // Ensure theories directory exists
  ensureTheoriesDirectory();

  // Seed bundled base theories (e.g., BaseLogic) into the working theories path
  const builtinTheoriesPath = path.resolve(__dirname, '../../theories');
  const seededBuiltinTheories = seedBuiltinTheories(builtinTheoriesPath);

  // Create canonical constants
  const globalSymbols = createCanonicalConstants(config.dimensions, config.workingFolder);

  // Preload default theories
  const loadedTheories = new Map();
  const defaultTheoryNames = [...seededBuiltinTheories, ...(options.defaultTheories || [])];

  for (const theoryName of defaultTheoryNames) {
    try {
      const theory = loadTheory(theoryName);
      loadedTheories.set(theoryName, theory);
    } catch (e) {
      console.warn(`Could not load default theory '${theoryName}':`, e.message);
    }
  }

  /**
   * Engine instance
   */
  const engine = {
    /**
     * Creates a new session
     * @param {Array<string>} [initialTheories=[]] - Theories to overlay
     * @returns {Object} SpockSession
     */
    createSession(initialTheories = []) {
      const mergedTheories = [...defaultTheoryNames, ...initialTheories];
      return createSessionFn(mergedTheories, globalSymbols);
    },

    /**
     * Loads a theory by name
     * @param {string} name - Theory name
     * @returns {Object} TheoryDescriptor
     */
    loadTheory(name) {
      if (loadedTheories.has(name)) {
        return loadedTheories.get(name);
      }
      const theory = loadTheory(name);
      loadedTheories.set(name, theory);
      return theory;
    },

    /**
     * Lists all available theories
     * @returns {Array<string>} Theory names
     */
    listTheories() {
      return listTheories();
    },

    /**
     * Gets current configuration
     * @returns {Object} Configuration
     */
    getConfig() {
      return getConfig();
    },

    /**
     * Gets global symbols (Truth, False, Zero)
     * @returns {Map<string, Object>} Global symbols
     */
    getGlobalSymbols() {
      return globalSymbols;
    },

    /**
     * Shuts down the engine (cleanup)
     */
    shutdown() {
      loadedTheories.clear();
      // Any other cleanup...
    }
  };

  return engine;
}

module.exports = {
  createSpockEngine
};
