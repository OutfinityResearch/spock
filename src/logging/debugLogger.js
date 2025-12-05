/**
 * @fileoverview Central Debug Logging System for Spock GOS
 *
 * Provides conditional, hierarchical debug logging for all components.
 * Configuration sources (in order of precedence):
 * 1. config.js settings (logLevel, traceEnabled)
 * 2. Environment variables (DEBUG, SPOCK_LOG_LEVEL)
 *
 * Log levels (from config.logLevel):
 * - 'silent': No output
 * - 'summary': Only summaries and errors
 * - 'full': All debug output
 *
 * Usage:
 *   const debug = require('./logging/debugLogger');
 *   debug.kernel.enter('vectorSpace', 'createVector', { dim: 512 });
 *   debug.dsl.step('parser', 'parseStatement', { tokens: [...] });
 *
 * @implements NFS-03, NFS-04 (Logging Configuration)
 */

'use strict';

// Lazy load config to avoid circular dependencies
let _configModule = null;
function getConfigModule() {
  if (!_configModule) {
    try {
      _configModule = require('../config/config');
    } catch (e) {
      // Config not available yet, use defaults
      _configModule = null;
    }
  }
  return _configModule;
}

/**
 * Gets current logging configuration from config.js + env
 * Called dynamically to pick up config changes
 * @returns {{logLevel: string, traceEnabled: boolean, debugModules: string[]}}
 */
function getLoggingConfig() {
  const configModule = getConfigModule();
  const config = configModule ? configModule.getConfig() : null;

  // Environment overrides (for backwards compatibility)
  const DEBUG_ENV = process.env.DEBUG;
  const ENV_LOG_LEVEL = process.env.SPOCK_LOG_LEVEL;

  // Determine log level: env > config > default
  let logLevel = 'full';
  if (config && config.logLevel) {
    logLevel = config.logLevel;
  }
  if (ENV_LOG_LEVEL) {
    logLevel = ENV_LOG_LEVEL;
  }

  // Handle DEBUG=false override
  if (DEBUG_ENV === 'false' || DEBUG_ENV === '0' || DEBUG_ENV === 'none') {
    logLevel = 'silent';
  }

  // Determine traceEnabled: config > default
  let traceEnabled = true;
  if (config && typeof config.traceEnabled === 'boolean') {
    traceEnabled = config.traceEnabled;
  }

  // Parse DEBUG modules filter
  let debugModules = [];
  if (DEBUG_ENV && DEBUG_ENV !== 'true' && DEBUG_ENV !== 'false' &&
      DEBUG_ENV !== '0' && DEBUG_ENV !== '1' && DEBUG_ENV !== '*' && DEBUG_ENV !== 'none') {
    debugModules = DEBUG_ENV.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
  }

  return { logLevel, traceEnabled, debugModules };
}

/**
 * Check if a module is enabled for debug based on current config
 * @param {string} moduleName - Module name to check
 * @returns {boolean}
 */
function isEnabled(moduleName) {
  const { logLevel, debugModules } = getLoggingConfig();

  // Silent disables everything
  if (logLevel === 'silent') return false;

  // If specific modules are listed in DEBUG env, only those are enabled
  if (debugModules.length > 0) {
    return debugModules.includes(moduleName.toLowerCase());
  }

  // Otherwise, full enables all, summary enables none (only explicit calls)
  return logLevel === 'full';
}

/**
 * Check if trace logging is enabled
 * @returns {boolean}
 */
function isTraceEnabled() {
  const { logLevel, traceEnabled } = getLoggingConfig();
  return logLevel !== 'silent' && traceEnabled;
}

/**
 * Check if summary-level logging is enabled
 * @returns {boolean}
 */
function isSummaryEnabled() {
  const { logLevel } = getLoggingConfig();
  return logLevel === 'summary' || logLevel === 'full';
}

// ANSI colors for terminal output
const hasColors = process.stdout.isTTY;
const c = {
  reset: hasColors ? '\x1b[0m' : '',
  dim: hasColors ? '\x1b[2m' : '',
  bright: hasColors ? '\x1b[1m' : '',
  // Component colors
  kernel: hasColors ? '\x1b[35m' : '',      // Magenta
  dsl: hasColors ? '\x1b[36m' : '',         // Cyan
  session: hasColors ? '\x1b[33m' : '',     // Yellow
  theory: hasColors ? '\x1b[34m' : '',      // Blue
  api: hasColors ? '\x1b[32m' : '',         // Green
  trace: hasColors ? '\x1b[90m' : '',       // Gray
  test: hasColors ? '\x1b[94m' : '',        // Light blue
  planning: hasColors ? '\x1b[96m' : '',    // Light cyan
  numeric: hasColors ? '\x1b[93m' : '',     // Light yellow
  // Value colors
  number: hasColors ? '\x1b[93m' : '',      // Light yellow
  string: hasColors ? '\x1b[92m' : '',      // Light green
  vector: hasColors ? '\x1b[95m' : '',      // Light magenta
  error: hasColors ? '\x1b[91m' : '',       // Light red
  success: hasColors ? '\x1b[92m' : '',     // Light green
};

// Indent tracking for nested calls
let indentLevel = 0;
const INDENT = '  ';

function getIndent() {
  return INDENT.repeat(indentLevel);
}

/**
 * Format a value for display
 * @param {*} value - Value to format
 * @param {number} maxLen - Max string length
 * @returns {string}
 */
function formatValue(value, maxLen = 80) {
  if (value === null) return `${c.dim}null${c.reset}`;
  if (value === undefined) return `${c.dim}undefined${c.reset}`;

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `${c.number}${value}${c.reset}`;
    }
    return `${c.number}${value.toFixed(6)}${c.reset}`;
  }

  if (typeof value === 'string') {
    if (value.length > maxLen) {
      return `${c.string}"${value.substring(0, maxLen)}..."${c.reset}`;
    }
    return `${c.string}"${value}"${c.reset}`;
  }

  if (typeof value === 'boolean') {
    return value ? `${c.success}true${c.reset}` : `${c.error}false${c.reset}`;
  }

  if (value instanceof Float32Array || value instanceof Float64Array) {
    return formatVector(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 5) {
      return `[${value.map(v => formatValue(v, 20)).join(', ')}]`;
    }
    return `[${value.slice(0, 3).map(v => formatValue(v, 20)).join(', ')}, ... (${value.length} items)]`;
  }

  if (typeof value === 'object') {
    return formatObject(value);
  }

  return String(value);
}

/**
 * Format a vector with stats
 * @param {Float32Array|Float64Array} vec - Vector to format
 * @param {number} showElements - Number of elements to show
 * @returns {string}
 */
function formatVector(vec, showElements = 5) {
  if (!vec || vec.length === 0) {
    return `${c.vector}Float32Array[]${c.reset}`;
  }

  // Calculate stats
  let sum = 0, min = Infinity, max = -Infinity;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i];
    if (vec[i] < min) min = vec[i];
    if (vec[i] > max) max = vec[i];
  }

  // Calculate norm
  let normSq = 0;
  for (let i = 0; i < vec.length; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq);

  // Format elements preview
  const preview = [];
  for (let i = 0; i < Math.min(showElements, vec.length); i++) {
    preview.push(vec[i].toFixed(4));
  }
  const elements = preview.join(', ');
  const ellipsis = vec.length > showElements ? ', ...' : '';

  const typeName = vec instanceof Float64Array ? 'Float64Array' : 'Float32Array';

  return `${c.vector}${typeName}[${vec.length}]${c.reset} ` +
         `${c.dim}[${elements}${ellipsis}]${c.reset} ` +
         `${c.dim}norm=${c.reset}${c.number}${norm.toFixed(4)}${c.reset} ` +
         `${c.dim}range=[${min.toFixed(4)}, ${max.toFixed(4)}]${c.reset}`;
}

/**
 * Format an object
 * @param {Object} obj - Object to format
 * @param {number} maxProps - Max properties to show
 * @returns {string}
 */
function formatObject(obj, maxProps = 5) {
  if (obj === null) return `${c.dim}null${c.reset}`;

  const keys = Object.keys(obj);
  if (keys.length === 0) return '{}';

  // Special handling for known types
  if (obj.type === 'NUMERIC') {
    return `${c.number}NUMERIC(${obj.value}${obj.unit ? ' ' + obj.unit : ''})${c.reset}`;
  }
  if (obj.type === 'VECTOR' && (obj.value instanceof Float32Array || obj.value instanceof Float64Array)) {
    return `VECTOR: ${formatVector(obj.value)}`;
  }
  if (obj.type === 'SCALAR') {
    return `${c.number}SCALAR(${obj.value})${c.reset}`;
  }

  const parts = [];
  for (let i = 0; i < Math.min(keys.length, maxProps); i++) {
    const key = keys[i];
    const val = obj[key];
    if (val instanceof Float32Array || val instanceof Float64Array) {
      parts.push(`${key}: ${val.constructor.name}[${val.length}]`);
    } else if (typeof val === 'object' && val !== null) {
      parts.push(`${key}: {...}`);
    } else {
      parts.push(`${key}: ${formatValue(val, 30)}`);
    }
  }

  const ellipsis = keys.length > maxProps ? ', ...' : '';
  return `{${parts.join(', ')}${ellipsis}}`;
}

/**
 * Get current timestamp
 * @returns {string}
 */
function timestamp() {
  const now = new Date();
  return `${c.dim}${now.toISOString().split('T')[1].slice(0, -1)}${c.reset}`;
}

/**
 * Create a logger for a specific module
 * Uses dynamic config checking for each log call
 * @param {string} moduleName - Module name
 * @param {string} moduleColor - ANSI color code
 * @returns {Object} Logger instance
 */
function createModuleLogger(moduleName, moduleColor) {
  // Check enabled dynamically on each call
  const checkEnabled = () => isEnabled(moduleName);

  return {
    // Dynamic enabled getter
    get enabled() {
      return checkEnabled();
    },

    /**
     * Log a function entry
     */
    enter(component, func, args = {}) {
      if (!checkEnabled()) return;
      const argsStr = Object.entries(args)
        .map(([k, v]) => `${k}=${formatValue(v)}`)
        .join(', ');
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}${c.bright}→ ${component}.${func}${c.reset}(${argsStr})`);
      indentLevel++;
    },

    /**
     * Log a function exit with result
     */
    exit(component, func, result) {
      if (!checkEnabled()) return;
      indentLevel = Math.max(0, indentLevel - 1);
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}${c.bright}← ${component}.${func}${c.reset} => ${formatValue(result)}`);
    },

    /**
     * Log an intermediate step
     */
    step(component, message, data = null) {
      if (!checkEnabled()) return;
      const dataStr = data !== null ? ` ${formatValue(data)}` : '';
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}${c.dim}• ${component}:${c.reset} ${message}${dataStr}`);
    },

    /**
     * Log a value inspection
     */
    inspect(label, value) {
      if (!checkEnabled()) return;
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}  ${c.dim}${label}:${c.reset} ${formatValue(value)}`);
    },

    /**
     * Log a warning (always shown unless silent)
     */
    warn(component, message) {
      if (getLoggingConfig().logLevel === 'silent') return;
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}${c.error}⚠ ${component}: ${message}${c.reset}`);
    },

    /**
     * Log an error (always shown unless silent)
     */
    error(component, message, err = null) {
      if (getLoggingConfig().logLevel === 'silent') return;
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}${c.error}✗ ${component}: ${message}${c.reset}`);
      if (err && checkEnabled()) {
        console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}  ${c.dim}${err.stack || err}${c.reset}`);
      }
    },

    /**
     * Log an operation with before/after
     */
    operation(component, opName, before, after) {
      if (!checkEnabled()) return;
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}${c.dim}◊ ${component}.${opName}${c.reset}`);
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}  ${c.dim}before:${c.reset} ${formatValue(before)}`);
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}  ${c.dim}after:${c.reset}  ${formatValue(after)}`);
    },

    /**
     * Log a comparison (for tests)
     */
    compare(label, actual, expected, passed) {
      if (!checkEnabled()) return;
      const status = passed ? `${c.success}✓${c.reset}` : `${c.error}✗${c.reset}`;
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}${status} ${label}`);
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}  ${c.dim}actual:${c.reset}   ${formatValue(actual)}`);
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}  ${c.dim}expected:${c.reset} ${formatValue(expected)}`);
    },

    /**
     * Raw log message
     */
    log(message) {
      if (!checkEnabled()) return;
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${getIndent()}${message}`);
    },

    /**
     * Section header (shown in summary mode too)
     */
    section(title) {
      if (!isSummaryEnabled()) return;
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${c.bright}━━━ ${title} ━━━${c.reset}`);
    },

    /**
     * Summary message (shown in summary and full modes)
     */
    summary(message, data = null) {
      if (!isSummaryEnabled()) return;
      const dataStr = data !== null ? ` ${formatValue(data)}` : '';
      console.log(`${timestamp()} ${moduleColor}[${moduleName.toUpperCase()}]${c.reset} ${c.bright}${message}${c.reset}${dataStr}`);
    }
  };
}

// Pre-configured loggers for each module
const kernel = createModuleLogger('kernel', c.kernel);
const dsl = createModuleLogger('dsl', c.dsl);
const session = createModuleLogger('session', c.session);
const theory = createModuleLogger('theory', c.theory);
const api = createModuleLogger('api', c.api);
const trace = createModuleLogger('trace', c.trace);
const test = createModuleLogger('test', c.test);
const planning = createModuleLogger('planning', c.planning);
const numeric = createModuleLogger('numeric', c.numeric);

/**
 * Reset indent level (useful for tests)
 */
function resetIndent() {
  indentLevel = 0;
}

/**
 * Check if any debug logging is enabled
 * @returns {boolean}
 */
function isAnyEnabled() {
  const { logLevel, debugModules } = getLoggingConfig();
  if (logLevel === 'silent') return false;
  if (debugModules.length > 0) return true;
  return logLevel === 'full';
}

/**
 * Get current logging configuration (for debugging)
 * @returns {Object}
 */
function getCurrentConfig() {
  return getLoggingConfig();
}

module.exports = {
  // Module loggers
  kernel,
  dsl,
  session,
  theory,
  api,
  trace,
  test,
  planning,
  numeric,

  // Utilities
  isEnabled,
  isTraceEnabled,
  isSummaryEnabled,
  isAnyEnabled,
  resetIndent,
  formatValue,
  formatVector,
  formatObject,
  getCurrentConfig,

  // For custom loggers
  createModuleLogger,

  // Colors export for other modules
  colors: c
};
