/**
 * @fileoverview Unit tests for vectorSpace.js
 */

'use strict';

const vectorSpace = require('../../src/kernel/vectorSpace');

// Test helpers
function assertClose(actual, expected, tolerance = 0.0001) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${expected} ± ${tolerance}, got ${actual}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Track results
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

// ============== TESTS ==============

console.log('\nvectorSpace.js');

// createVector tests
test('createVector: creates vector with correct dimension', () => {
  const v = vectorSpace.createVector(512);
  assertEqual(v.length, 512);
  assert(v instanceof Float32Array, 'Should be Float32Array');
});

test('createVector: initializes to zeros', () => {
  const v = vectorSpace.createVector(10);
  for (let i = 0; i < 10; i++) {
    assertEqual(v[i], 0, `Element ${i} should be 0`);
  }
});

test('createVector: handles small dimensions', () => {
  const v = vectorSpace.createVector(1);
  assertEqual(v.length, 1);
  assertEqual(v[0], 0);
});

// createRandomVector tests
test('createRandomVector: creates non-zero vector', () => {
  const v = vectorSpace.createRandomVector(100);
  assertEqual(v.length, 100);
  const sum = v.reduce((a, b) => a + Math.abs(b), 0);
  assert(sum > 0, 'Should have non-zero elements');
});

test('createRandomVector: different seeds produce different vectors', () => {
  vectorSpace.setRandomSeed(1);
  const v1 = vectorSpace.createRandomVector(10);
  vectorSpace.setRandomSeed(2);
  const v2 = vectorSpace.createRandomVector(10);

  let same = true;
  for (let i = 0; i < 10; i++) {
    if (Math.abs(v1[i] - v2[i]) > 0.0001) {
      same = false;
      break;
    }
  }
  assert(!same, 'Different seeds should produce different vectors');
});

// cloneVector tests
test('cloneVector: creates deep copy', () => {
  const original = new Float32Array([1, 2, 3, 4, 5]);
  const clone = vectorSpace.cloneVector(original);

  assertEqual(clone.length, original.length);
  for (let i = 0; i < original.length; i++) {
    assertEqual(clone[i], original[i], `Element ${i} should match`);
  }
});

test('cloneVector: no shared references', () => {
  const original = new Float32Array([1, 2, 3]);
  const clone = vectorSpace.cloneVector(original);

  clone[0] = 999;
  assertEqual(original[0], 1, 'Original should be unchanged');
});

// dot product tests
test('dot: orthogonal vectors', () => {
  const a = new Float32Array([1, 0]);
  const b = new Float32Array([0, 1]);
  assertClose(vectorSpace.dot(a, b), 0);
});

test('dot: parallel vectors', () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([1, 2]);
  assertEqual(vectorSpace.dot(a, b), 5);
});

test('dot: zero vector', () => {
  const a = new Float32Array([0, 0]);
  const b = new Float32Array([1, 1]);
  assertEqual(vectorSpace.dot(a, b), 0);
});

test('dot: negative values', () => {
  const a = new Float32Array([1, -1]);
  const b = new Float32Array([-1, 1]);
  assertEqual(vectorSpace.dot(a, b), -2);
});

test('dot: commutativity', () => {
  const a = new Float32Array([1, 2, 3]);
  const b = new Float32Array([4, 5, 6]);
  assertEqual(vectorSpace.dot(a, b), vectorSpace.dot(b, a));
});

// norm tests
test('norm: unit vector', () => {
  const v = new Float32Array([1, 0, 0]);
  assertClose(vectorSpace.norm(v), 1);
});

test('norm: zero vector', () => {
  const v = new Float32Array([0, 0, 0]);
  assertEqual(vectorSpace.norm(v), 0);
});

test('norm: general vector (3-4-5 triangle)', () => {
  const v = new Float32Array([3, 4]);
  assertEqual(vectorSpace.norm(v), 5);
});

// normalise tests
test('normalise: non-zero vector', () => {
  const v = new Float32Array([3, 4]);
  const n = vectorSpace.normalise(v);
  assertClose(n[0], 0.6);
  assertClose(n[1], 0.8);
});

test('normalise: already normalized', () => {
  const v = new Float32Array([1, 0]);
  const n = vectorSpace.normalise(v);
  assertClose(n[0], 1);
  assertClose(n[1], 0);
});

test('normalise: zero vector returns zero (no NaN)', () => {
  const v = new Float32Array([0, 0]);
  const n = vectorSpace.normalise(v);
  assert(!isNaN(n[0]), 'Should not be NaN');
  assert(!isNaN(n[1]), 'Should not be NaN');
});

test('normalise: idempotent', () => {
  const v = new Float32Array([3, 4, 5]);
  const n1 = vectorSpace.normalise(v);
  const n2 = vectorSpace.normalise(n1);

  for (let i = 0; i < 3; i++) {
    assertClose(n1[i], n2[i]);
  }
});

test('normalise: result has unit length', () => {
  const v = new Float32Array([1, 2, 3, 4, 5]);
  const n = vectorSpace.normalise(v);
  assertClose(vectorSpace.norm(n), 1);
});

// cosineSimilarity tests
test('cosineSimilarity: identical vectors', () => {
  const v = new Float32Array([1, 2, 3]);
  assertClose(vectorSpace.cosineSimilarity(v, v), 1);
});

test('cosineSimilarity: opposite vectors', () => {
  const a = new Float32Array([1, 0]);
  const b = new Float32Array([-1, 0]);
  assertClose(vectorSpace.cosineSimilarity(a, b), -1);
});

test('cosineSimilarity: orthogonal vectors', () => {
  const a = new Float32Array([1, 0]);
  const b = new Float32Array([0, 1]);
  assertClose(vectorSpace.cosineSimilarity(a, b), 0);
});

// scale tests
test('scale: basic scaling', () => {
  const v = new Float32Array([2, 4, 6]);
  const s = vectorSpace.scale(v, 0.5);
  assertEqual(s[0], 1);
  assertEqual(s[1], 2);
  assertEqual(s[2], 3);
});

test('scale: zero scalar', () => {
  const v = new Float32Array([1, 2, 3]);
  const s = vectorSpace.scale(v, 0);
  assertEqual(s[0], 0);
  assertEqual(s[1], 0);
  assertEqual(s[2], 0);
});

// addVectors tests
test('addVectors: basic addition', () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const r = vectorSpace.addVectors(a, b);
  assertEqual(r[0], 4);
  assertEqual(r[1], 6);
});

// hadamard tests
test('hadamard: element-wise product', () => {
  const a = new Float32Array([2, 3]);
  const b = new Float32Array([4, 5]);
  const r = vectorSpace.hadamard(a, b);
  assertEqual(r[0], 8);
  assertEqual(r[1], 15);
});

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`vectorSpace.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
