/**
 * @fileoverview Enhanced Test Framework for Spock GOS
 *
 * Provides detailed, structured test output with:
 * - Specification reference tracking (DS/FS/URS/NFS)
 * - Input/Expected/Actual value display
 * - Category grouping
 * - Verbose mode for debugging
 * - Summary statistics
 * - Integration with debugLogger for kernel-level tracing
 *
 * Debug modes:
 * - VERBOSE=true: Show test inputs/expected values
 * - DEBUG=true (default): Show kernel operations during tests
 * - DEBUG=false: Disable kernel debug output
 */

'use strict';

// Configuration
const config = {
  verbose: process.env.VERBOSE === 'true' || process.argv.includes('--verbose'),
  showInputs: process.env.SHOW_INPUTS !== 'false',
  colors: process.stdout.isTTY,
  showDebugOutput: process.env.DEBUG !== 'false' && process.env.DEBUG !== '0'
};

// ANSI colors
const colors = {
  reset: config.colors ? '\x1b[0m' : '',
  bright: config.colors ? '\x1b[1m' : '',
  dim: config.colors ? '\x1b[2m' : '',
  green: config.colors ? '\x1b[32m' : '',
  red: config.colors ? '\x1b[31m' : '',
  yellow: config.colors ? '\x1b[33m' : '',
  blue: config.colors ? '\x1b[34m' : '',
  cyan: config.colors ? '\x1b[36m' : '',
  gray: config.colors ? '\x1b[90m' : ''
};

// Test results storage
const results = {
  suites: [],
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: null,
  currentSuite: null,
  currentCategory: null
};

// Symbols
const symbols = {
  pass: config.colors ? '✓' : '[PASS]',
  fail: config.colors ? '✗' : '[FAIL]',
  skip: config.colors ? '○' : '[SKIP]',
  arrow: config.colors ? '→' : '->',
  bullet: config.colors ? '•' : '-'
};

/**
 * Starts a new test suite
 * @param {string} name - Suite name (module under test)
 * @param {Object} options - Suite options
 * @param {string} options.file - Source file being tested
 * @param {string[]} options.specs - Related specification IDs (URS, FS, DS, NFS)
 */
function suite(name, options = {}) {
  results.currentSuite = {
    name,
    file: options.file || null,
    specs: options.specs || [],
    categories: [],
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: Date.now()
  };
  results.suites.push(results.currentSuite);
  results.currentCategory = null;

  console.log('');
  console.log(`${colors.bright}${colors.blue}━━━ ${name} ━━━${colors.reset}`);
  if (options.file) {
    console.log(`${colors.dim}    File: ${options.file}${colors.reset}`);
  }
  if (options.specs && options.specs.length > 0) {
    console.log(`${colors.dim}    Specs: ${options.specs.join(', ')}${colors.reset}`);
  }
  // Show debug status
  const debugStatus = config.showDebugOutput ? 'enabled (set DEBUG=false to disable)' : 'disabled';
  console.log(`${colors.dim}    Debug: ${debugStatus}${colors.reset}`);
}

/**
 * Groups tests by category
 * @param {string} name - Category name
 */
function category(name) {
  results.currentCategory = name;
  if (results.currentSuite) {
    results.currentSuite.categories.push(name);
  }
  console.log('');
  console.log(`  ${colors.cyan}${name}${colors.reset}`);
}

/**
 * Enhanced test function with detailed output
 * @param {string} name - Test name
 * @param {Object} options - Test options
 * @param {string} options.input - Input description
 * @param {string} options.expected - Expected result description
 * @param {string} options.spec - Related spec reference
 * @param {Function} fn - Test function
 */
function test(name, options, fn) {
  // Handle simplified signature: test(name, fn)
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  const testRecord = {
    name,
    category: results.currentCategory,
    options,
    status: 'pending',
    error: null,
    duration: 0
  };

  if (results.currentSuite) {
    results.currentSuite.tests.push(testRecord);
  }

  const startTime = Date.now();

  try {
    fn();
    testRecord.status = 'passed';
    testRecord.duration = Date.now() - startTime;
    results.passed++;
    if (results.currentSuite) results.currentSuite.passed++;

    // Success output
    let output = `    ${colors.green}${symbols.pass}${colors.reset} ${name}`;
    if (config.verbose && options.input) {
      output += `\n      ${colors.dim}Input: ${options.input}${colors.reset}`;
    }
    if (config.verbose && options.expected) {
      output += `\n      ${colors.dim}Expected: ${options.expected}${colors.reset}`;
    }
    if (options.spec) {
      output += ` ${colors.gray}[${options.spec}]${colors.reset}`;
    }
    console.log(output);

  } catch (e) {
    testRecord.status = 'failed';
    testRecord.error = e;
    testRecord.duration = Date.now() - startTime;
    results.failed++;
    if (results.currentSuite) results.currentSuite.failed++;

    // Failure output with details
    console.log(`    ${colors.red}${symbols.fail}${colors.reset} ${name}`);
    if (options.input) {
      console.log(`      ${colors.dim}Input: ${options.input}${colors.reset}`);
    }
    if (options.expected) {
      console.log(`      ${colors.dim}Expected: ${options.expected}${colors.reset}`);
    }
    console.log(`      ${colors.red}Error: ${e.message}${colors.reset}`);
    if (config.verbose && e.stack) {
      const stackLines = e.stack.split('\n').slice(1, 4);
      stackLines.forEach(line => {
        console.log(`      ${colors.dim}${line.trim()}${colors.reset}`);
      });
    }
  }
}

/**
 * Skip a test
 */
function skip(name, reason = '') {
  results.skipped++;
  if (results.currentSuite) results.currentSuite.skipped++;

  let output = `    ${colors.yellow}${symbols.skip}${colors.reset} ${colors.dim}${name}${colors.reset}`;
  if (reason) {
    output += ` ${colors.gray}(${reason})${colors.reset}`;
  }
  console.log(output);
}

// ============== Assertion Helpers ==============

/**
 * Enhanced assertEqual with detailed error messages
 */
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    const details = `\n    Actual:   ${JSON.stringify(actual)}\n    Expected: ${JSON.stringify(expected)}`;
    throw new Error((message || 'Values not equal') + details);
  }
}

/**
 * Enhanced assertClose for floating point
 */
function assertClose(actual, expected, tolerance = 0.0001, message) {
  if (Math.abs(actual - expected) > tolerance) {
    const details = `\n    Actual:   ${actual}\n    Expected: ${expected} ± ${tolerance}\n    Diff:     ${Math.abs(actual - expected)}`;
    throw new Error((message || 'Values not close') + details);
  }
}

/**
 * Assert condition is true
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Assert function throws
 */
function assertThrows(fn, expectedMessage, message) {
  let threw = false;
  let actualError = null;
  try {
    fn();
  } catch (e) {
    threw = true;
    actualError = e;
  }
  if (!threw) {
    throw new Error(message || 'Expected function to throw, but it did not');
  }
  if (expectedMessage && actualError && !actualError.message.includes(expectedMessage)) {
    throw new Error(`Expected error containing "${expectedMessage}", got: "${actualError.message}"`);
  }
}

/**
 * Assert arrays are equal
 */
function assertArrayEqual(actual, expected, message) {
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    throw new Error('Both arguments must be arrays');
  }
  if (actual.length !== expected.length) {
    throw new Error(`${message || 'Arrays differ'}: length ${actual.length} vs ${expected.length}`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new Error(`${message || 'Arrays differ'} at index ${i}: ${actual[i]} vs ${expected[i]}`);
    }
  }
}

/**
 * Assert Float32Array values are close
 */
function assertVectorClose(actual, expected, tolerance = 0.0001, message) {
  if (actual.length !== expected.length) {
    throw new Error(`${message || 'Vectors differ'}: length ${actual.length} vs ${expected.length}`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (Math.abs(actual[i] - expected[i]) > tolerance) {
      throw new Error(`${message || 'Vectors differ'} at index ${i}: ${actual[i]} vs ${expected[i]}`);
    }
  }
}

/**
 * Assert object has property
 */
function assertHas(obj, prop, message) {
  if (!(prop in obj)) {
    throw new Error(message || `Object missing property: ${prop}`);
  }
}

/**
 * Assert type
 */
function assertType(value, type, message) {
  const actualType = typeof value;
  if (actualType !== type) {
    throw new Error(message || `Expected type ${type}, got ${actualType}`);
  }
}

/**
 * Assert instance of
 */
function assertInstance(value, constructor, message) {
  if (!(value instanceof constructor)) {
    throw new Error(message || `Expected instance of ${constructor.name}`);
  }
}

// ============== Summary and Reporting ==============

/**
 * Print test summary
 */
function summary() {
  const totalTests = results.passed + results.failed + results.skipped;
  const totalDuration = results.suites.reduce((sum, s) => sum + (Date.now() - s.startTime), 0);

  console.log('');
  console.log(`${colors.bright}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}  TEST SUMMARY${colors.reset}`);
  console.log(`${'═'.repeat(60)}`);
  console.log('');

  // Per-suite results
  console.log(`  ${colors.bright}Suites:${colors.reset}`);
  for (const s of results.suites) {
    const status = s.failed === 0
      ? `${colors.green}PASS${colors.reset}`
      : `${colors.red}FAIL${colors.reset}`;
    const counts = `${s.passed}/${s.passed + s.failed}`;
    console.log(`    ${status} ${s.name} (${counts} tests)`);
  }

  console.log('');
  console.log(`  ${colors.bright}Totals:${colors.reset}`);
  console.log(`    ${colors.green}Passed:${colors.reset}  ${results.passed}`);
  if (results.failed > 0) {
    console.log(`    ${colors.red}Failed:${colors.reset}  ${results.failed}`);
  }
  if (results.skipped > 0) {
    console.log(`    ${colors.yellow}Skipped:${colors.reset} ${results.skipped}`);
  }
  console.log(`    Total:   ${totalTests}`);

  console.log('');

  // Exit code
  if (results.failed > 0) {
    console.log(`${colors.red}${colors.bright}Some tests failed!${colors.reset}`);
    return 1;
  } else {
    console.log(`${colors.green}${colors.bright}All tests passed!${colors.reset}`);
    return 0;
  }
}

/**
 * Exit with appropriate code
 */
function exit() {
  const code = summary();
  process.exit(code);
}

// ============== Exports ==============

module.exports = {
  // Core test functions
  suite,
  category,
  test,
  skip,

  // Assertions
  assert,
  assertEqual,
  assertClose,
  assertThrows,
  assertArrayEqual,
  assertVectorClose,
  assertHas,
  assertType,
  assertInstance,

  // Reporting
  summary,
  exit,

  // Configuration
  config,
  colors,

  // Results access (for custom reporters)
  getResults: () => results
};
