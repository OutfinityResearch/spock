/**
 * @fileoverview Parametric tests for vectorSpace.js across different
 * dimensions and numeric types
 *
 * Run with -v or --verbose for detailed output
 */

'use strict';

const { setConfig, resetConfig, getConfig, getTypedArrayConstructor, TYPED_ARRAY_MAP, NUMERIC_RANGES } = require('../../src/config/config');
const vectorSpace = require('../../src/kernel/vectorSpace');

// Check for verbose mode
const VERBOSE = process.argv.includes('-v') || process.argv.includes('--verbose');

// Test configurations: combinations of dimensions and numeric types
const TEST_DIMENSIONS = [64, 128, 256, 512, 1024];
const TEST_NUMERIC_TYPES = ['int8', 'int16', 'int32', 'uint8', 'uint16', 'uint32', 'float32', 'float64'];
const TEST_GENERATION_MODES = ['gaussian', 'bipolar'];

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

// Track results
let passed = 0;
let failed = 0;
let skipped = 0;

/**
 * Formats a number for display
 */
function formatNum(n, precision = 4) {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(precision);
}

/**
 * Shows vector sample (first and last few elements)
 */
function vectorSample(vec, count = 3) {
  const parts = [];
  for (let i = 0; i < Math.min(count, vec.length); i++) {
    parts.push(formatNum(vec[i]));
  }
  parts.push('...');
  for (let i = Math.max(count, vec.length - count); i < vec.length; i++) {
    parts.push(formatNum(vec[i]));
  }
  return `[${parts.join(', ')}]`;
}

/**
 * Computes basic stats for a vector
 */
function vectorStats(vec) {
  let min = Infinity, max = -Infinity, sum = 0, nonZero = 0;
  for (let i = 0; i < vec.length; i++) {
    if (vec[i] < min) min = vec[i];
    if (vec[i] > max) max = vec[i];
    sum += vec[i];
    if (vec[i] !== 0) nonZero++;
  }
  const mean = sum / vec.length;

  let variance = 0;
  for (let i = 0; i < vec.length; i++) {
    variance += (vec[i] - mean) ** 2;
  }
  const std = Math.sqrt(variance / vec.length);

  return { min, max, mean, std, nonZero, length: vec.length };
}

/**
 * Logs verbose info
 */
function verbose(...args) {
  if (VERBOSE) {
    console.log('    ' + colors.dim + args.join(' ') + colors.reset);
  }
}

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ${colors.green}✓${colors.reset} ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ${colors.red}✗${colors.reset} ${name}`);
    console.log(`    ${colors.red}${e.message}${colors.reset}`);
  }
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(message || `Expected ${expected} ± ${tolerance}, got ${actual}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Run tests for a specific configuration
 */
function runConfigTests(dim, numericType, vectorGeneration) {
  const configName = `dim=${dim}, type=${numericType}, gen=${vectorGeneration}`;

  // Configure
  resetConfig();
  setConfig({
    dimensions: dim,
    numericType: numericType,
    vectorGeneration: vectorGeneration,
    randomSeed: 42  // Deterministic
  });
  vectorSpace.setRandomSeed(42);

  const TypedArray = TYPED_ARRAY_MAP[numericType];
  const isFloat = numericType === 'float32' || numericType === 'float64';
  const isSigned = numericType.startsWith('int') || isFloat;
  const range = NUMERIC_RANGES[numericType];

  // Show configuration details in verbose mode
  if (VERBOSE) {
    console.log(`\n  ${colors.cyan}Configuration:${colors.reset}`);
    console.log(`    ${colors.dim}Dimensions:${colors.reset} ${dim}`);
    console.log(`    ${colors.dim}Numeric type:${colors.reset} ${numericType} (${TypedArray.name})`);
    console.log(`    ${colors.dim}Generation:${colors.reset} ${vectorGeneration}`);
    console.log(`    ${colors.dim}Range:${colors.reset} [${range.min}, ${range.max}]`);
    console.log(`    ${colors.dim}Signed:${colors.reset} ${isSigned}, ${colors.dim}Float:${colors.reset} ${isFloat}`);
    console.log(`    ${colors.dim}Bytes per element:${colors.reset} ${TypedArray.BYTES_PER_ELEMENT}`);
    console.log(`    ${colors.dim}Total memory:${colors.reset} ${dim * TypedArray.BYTES_PER_ELEMENT} bytes`);
    console.log();
  }

  // Test: createVector
  test(`[${configName}] createVector returns correct type and length`, () => {
    const vec = vectorSpace.createVector();
    verbose(`Created zero vector: ${vectorSample(vec, 4)}`);
    verbose(`Type: ${vec.constructor.name}, Length: ${vec.length}`);
    assert(vec instanceof TypedArray, `Expected ${numericType} array`);
    assert(vec.length === dim, `Expected length ${dim}, got ${vec.length}`);
  });

  // Test: createVector is zero-initialized
  test(`[${configName}] createVector is zero-initialized`, () => {
    const vec = vectorSpace.createVector();
    const stats = vectorStats(vec);
    verbose(`Zero vector stats: min=${stats.min}, max=${stats.max}, nonZero=${stats.nonZero}`);
    for (let i = 0; i < vec.length; i++) {
      assert(vec[i] === 0, `Element ${i} should be 0, got ${vec[i]}`);
    }
  });

  // Test: createRandomVector
  test(`[${configName}] createRandomVector returns non-zero vector`, () => {
    const vec = vectorSpace.createRandomVector();
    const stats = vectorStats(vec);
    verbose(`Random vector: ${vectorSample(vec, 4)}`);
    verbose(`Stats: min=${formatNum(stats.min)}, max=${formatNum(stats.max)}, mean=${formatNum(stats.mean)}, std=${formatNum(stats.std)}`);
    verbose(`Non-zero elements: ${stats.nonZero}/${stats.length} (${(100*stats.nonZero/stats.length).toFixed(1)}%)`);

    assert(vec instanceof TypedArray, `Expected ${numericType} array`);
    assert(vec.length === dim, `Expected length ${dim}`);

    // Check that at least some elements are non-zero
    // For unsigned bipolar (0/1), expect ~50% zeros, so threshold is lower
    const threshold = (vectorGeneration === 'bipolar' && !isSigned) ? dim / 4 : dim / 2;
    assert(stats.nonZero > threshold, `Expected more non-zero elements, got ${stats.nonZero}/${dim} (threshold: ${threshold})`);
  });

  // Test: createRandomVector respects value ranges
  test(`[${configName}] createRandomVector values in valid range`, () => {
    const vec = vectorSpace.createRandomVector();

    if (numericType === 'int8') {
      for (let i = 0; i < vec.length; i++) {
        assert(vec[i] >= -128 && vec[i] <= 127, `int8 out of range: ${vec[i]}`);
      }
    } else if (numericType === 'uint8') {
      for (let i = 0; i < vec.length; i++) {
        assert(vec[i] >= 0 && vec[i] <= 255, `uint8 out of range: ${vec[i]}`);
      }
    } else if (numericType === 'int16') {
      for (let i = 0; i < vec.length; i++) {
        assert(vec[i] >= -32768 && vec[i] <= 32767, `int16 out of range: ${vec[i]}`);
      }
    } else if (numericType === 'uint16') {
      for (let i = 0; i < vec.length; i++) {
        assert(vec[i] >= 0 && vec[i] <= 65535, `uint16 out of range: ${vec[i]}`);
      }
    }
    // int32, uint32, float32, float64 have large ranges, TypedArray handles clamping
  });

  // Test: bipolar generation
  if (vectorGeneration === 'bipolar') {
    test(`[${configName}] bipolar generation produces expected values`, () => {
      const vec = vectorSpace.createRandomVector();

      if (isSigned) {
        // Should be -1 or +1
        for (let i = 0; i < vec.length; i++) {
          assert(vec[i] === -1 || vec[i] === 1, `Bipolar signed should be ±1, got ${vec[i]}`);
        }
      } else {
        // Unsigned: should be 0 or 1
        for (let i = 0; i < vec.length; i++) {
          assert(vec[i] === 0 || vec[i] === 1, `Bipolar unsigned should be 0/1, got ${vec[i]}`);
        }
      }
    });
  }

  // Test: dot product
  test(`[${configName}] dot product works`, () => {
    const a = vectorSpace.createRandomVector();
    const b = vectorSpace.createRandomVector();
    const d = vectorSpace.dot(a, b);
    verbose(`a: ${vectorSample(a, 3)}`);
    verbose(`b: ${vectorSample(b, 3)}`);
    verbose(`dot(a, b) = ${formatNum(d)}`);
    assert(typeof d === 'number', 'Dot product should return number');
    assert(isFinite(d), 'Dot product should be finite');
  });

  // Test: dot product of vector with itself is non-negative
  test(`[${configName}] dot(v, v) >= 0`, () => {
    const v = vectorSpace.createRandomVector();
    const d = vectorSpace.dot(v, v);
    verbose(`v: ${vectorSample(v, 3)}`);
    verbose(`dot(v, v) = ${formatNum(d)} (squared norm)`);
    assert(d >= 0, `Self dot product should be >= 0, got ${d}`);
  });

  // Test: norm
  test(`[${configName}] norm is non-negative`, () => {
    const v = vectorSpace.createRandomVector();
    const n = vectorSpace.norm(v);
    verbose(`v: ${vectorSample(v, 3)}`);
    verbose(`||v|| = ${formatNum(n)}`);
    assert(n >= 0, `Norm should be >= 0, got ${n}`);
    assert(isFinite(n), 'Norm should be finite');
  });

  // Test: addVectors
  test(`[${configName}] addVectors works`, () => {
    const a = vectorSpace.createRandomVector();
    const b = vectorSpace.createRandomVector();
    const sum = vectorSpace.addVectors(a, b);
    verbose(`a: ${vectorSample(a, 3)}`);
    verbose(`b: ${vectorSample(b, 3)}`);
    verbose(`a + b: ${vectorSample(sum, 3)}`);
    verbose(`Verify: a[0]=${formatNum(a[0])} + b[0]=${formatNum(b[0])} = ${formatNum(a[0]+b[0])} (actual: ${formatNum(sum[0])})`);

    assert(sum instanceof TypedArray, 'Sum should be same type');
    assert(sum.length === dim, 'Sum should have same length');
  });

  // Test: hadamard product
  test(`[${configName}] hadamard product works`, () => {
    const a = vectorSpace.createRandomVector();
    const b = vectorSpace.createRandomVector();
    const prod = vectorSpace.hadamard(a, b);
    verbose(`a: ${vectorSample(a, 3)}`);
    verbose(`b: ${vectorSample(b, 3)}`);
    verbose(`a ⊙ b: ${vectorSample(prod, 3)}`);
    verbose(`Verify: a[0]=${formatNum(a[0])} * b[0]=${formatNum(b[0])} = ${formatNum(a[0]*b[0])} (actual: ${formatNum(prod[0])})`);

    assert(prod instanceof TypedArray, 'Product should be same type');
    assert(prod.length === dim, 'Product should have same length');
  });

  // Test: scale
  test(`[${configName}] scale works`, () => {
    const v = vectorSpace.createRandomVector();
    const factor = 2;
    const scaled = vectorSpace.scale(v, factor);
    verbose(`v: ${vectorSample(v, 3)}`);
    verbose(`${factor} * v: ${vectorSample(scaled, 3)}`);
    verbose(`Verify: ${factor} * v[0]=${formatNum(v[0])} = ${formatNum(factor*v[0])} (actual: ${formatNum(scaled[0])})`);

    assert(scaled instanceof TypedArray, 'Scaled should be same type');
    assert(scaled.length === dim, 'Scaled should have same length');
  });

  // Test: normalise (only meaningful for floats)
  if (isFloat) {
    test(`[${configName}] normalise produces unit vector`, () => {
      const v = vectorSpace.createRandomVector();
      const n = vectorSpace.normalise(v);
      const normBefore = vectorSpace.norm(v);
      const normAfter = vectorSpace.norm(n);
      verbose(`v: ${vectorSample(v, 3)}, ||v|| = ${formatNum(normBefore)}`);
      verbose(`normalized: ${vectorSample(n, 3)}, ||n|| = ${formatNum(normAfter)}`);
      assertClose(normAfter, 1.0, 0.0001, `Normalised vector should have norm 1, got ${normAfter}`);
    });
  }

  // Test: cloneVector
  test(`[${configName}] cloneVector creates independent copy`, () => {
    const v = vectorSpace.createRandomVector();
    const copy = vectorSpace.cloneVector(v);
    const originalFirst = v[0];
    copy[0] = copy[0] + 1;
    verbose(`Original v[0]: ${formatNum(originalFirst)}`);
    verbose(`After modifying copy: v[0]=${formatNum(v[0])}, copy[0]=${formatNum(copy[0])}`);
    verbose(`Independence check: ${v[0] !== copy[0] ? 'PASS' : 'FAIL'}`);

    assert(copy instanceof TypedArray, 'Clone should be same type');
    assert(v[0] !== copy[0], 'Clone should be independent');
  });

  // Test: cosineSimilarity
  test(`[${configName}] cosineSimilarity of identical vectors is 1`, () => {
    const v = vectorSpace.createRandomVector();
    const sim = vectorSpace.cosineSimilarity(v, v);
    verbose(`v: ${vectorSample(v, 3)}`);
    verbose(`cos(v, v) = ${formatNum(sim)}`);

    // Also test with different vector
    const w = vectorSpace.createRandomVector();
    const simDiff = vectorSpace.cosineSimilarity(v, w);
    verbose(`w: ${vectorSample(w, 3)}`);
    verbose(`cos(v, w) = ${formatNum(simDiff)} (should be near 0 for random orthogonal vectors)`);

    assertClose(sim, 1.0, 0.0001, `Cosine similarity of v with v should be 1, got ${sim}`);
  });

  // Test: dimension mismatch throws
  test(`[${configName}] dimension mismatch throws error`, () => {
    const a = vectorSpace.createVector(dim);
    const smallerDim = dim > 64 ? 64 : dim;

    // Create a vector with different dimension manually
    resetConfig();
    setConfig({ dimensions: smallerDim, numericType, vectorGeneration, randomSeed: 42 });
    const b = vectorSpace.createVector();

    // Restore original config
    setConfig({ dimensions: dim, numericType, vectorGeneration, randomSeed: 42 });

    if (dim !== smallerDim) {
      let threw = false;
      try {
        vectorSpace.dot(a, b);
      } catch (e) {
        threw = true;
        assert(e.message.includes('mismatch'), 'Should throw dimension mismatch error');
      }
      assert(threw, 'Should throw on dimension mismatch');
    }
  });
}

// ============== RUN PARAMETRIC TESTS ==============

console.log('\n=== Parametric Vector Space Tests ===\n');

// Selected combinations to test (10+ combinations)
const testCombinations = [
  // Float types at various dimensions
  { dim: 64, type: 'float32', gen: 'gaussian' },
  { dim: 128, type: 'float32', gen: 'bipolar' },
  { dim: 256, type: 'float64', gen: 'gaussian' },
  { dim: 512, type: 'float64', gen: 'bipolar' },
  { dim: 1024, type: 'float32', gen: 'gaussian' },

  // Integer types
  { dim: 64, type: 'int8', gen: 'bipolar' },
  { dim: 128, type: 'int8', gen: 'gaussian' },
  { dim: 256, type: 'int16', gen: 'bipolar' },
  { dim: 512, type: 'int32', gen: 'gaussian' },

  // Unsigned integer types
  { dim: 64, type: 'uint8', gen: 'bipolar' },
  { dim: 128, type: 'uint16', gen: 'gaussian' },
  { dim: 256, type: 'uint32', gen: 'bipolar' },
];

for (const combo of testCombinations) {
  console.log(`\n--- Testing: dim=${combo.dim}, type=${combo.type}, gen=${combo.gen} ---`);
  runConfigTests(combo.dim, combo.type, combo.gen);
}

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(60));
console.log(`Parametric Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);

// Cleanup
resetConfig();

if (failed > 0) {
  process.exit(1);
}
