/**
 * @fileoverview Unit tests for primitiveOps.js
 */

'use strict';

const ops = require('../../src/kernel/primitiveOps');

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

console.log('\nprimitiveOps.js');

// add tests
test('add: basic addition', () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const r = ops.add(a, b);
  assertEqual(r[0], 4);
  assertEqual(r[1], 6);
});

test('add: commutativity', () => {
  const a = new Float32Array([1, 2, 3]);
  const b = new Float32Array([4, 5, 6]);
  const r1 = ops.add(a, b);
  const r2 = ops.add(b, a);
  for (let i = 0; i < 3; i++) {
    assertEqual(r1[i], r2[i], `Element ${i} should be equal`);
  }
});

test('add: identity (zero vector)', () => {
  const a = new Float32Array([1, 2]);
  const zero = new Float32Array([0, 0]);
  const r = ops.add(a, zero);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
});

test('add: negative values', () => {
  const a = new Float32Array([1, -2]);
  const b = new Float32Array([-1, 2]);
  const r = ops.add(a, b);
  assertEqual(r[0], 0);
  assertEqual(r[1], 0);
});

// bind tests
test('bind: element-wise product', () => {
  const a = new Float32Array([2, 3]);
  const b = new Float32Array([4, 5]);
  const r = ops.bind(a, b);
  assertEqual(r[0], 8);
  assertEqual(r[1], 15);
});

test('bind: identity (ones)', () => {
  const a = new Float32Array([1, 2]);
  const ones = new Float32Array([1, 1]);
  const r = ops.bind(a, ones);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
});

test('bind: zero element', () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([0, 1]);
  const r = ops.bind(a, b);
  assertEqual(r[0], 0);
  assertEqual(r[1], 2);
});

// negate tests
test('negate: basic negation', () => {
  const v = new Float32Array([1, -2]);
  const r = ops.negate(v);
  assertEqual(r[0], -1);
  assertEqual(r[1], 2);
});

test('negate: double negation', () => {
  const v = new Float32Array([1, 2, 3]);
  const r = ops.negate(ops.negate(v));
  for (let i = 0; i < 3; i++) {
    assertClose(r[i], v[i]);
  }
});

test('negate: zero vector', () => {
  const v = new Float32Array([0, 0]);
  const r = ops.negate(v);
  assertEqual(r[0], 0);
  assertEqual(r[1], 0);
});

// distance tests
test('distance: same vectors', () => {
  const v = new Float32Array([1, 2, 3]);
  const d = ops.distance(v, v);
  assertClose(d, 1);  // Cosine similarity of identical vectors
});

test('distance: symmetry', () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const d1 = ops.distance(a, b);
  const d2 = ops.distance(b, a);
  assertClose(d1, d2);
});

test('distance: orthogonal vectors', () => {
  const a = new Float32Array([1, 0]);
  const b = new Float32Array([0, 1]);
  const d = ops.distance(a, b);
  assertClose(d, 0);  // Orthogonal vectors have 0 cosine similarity
});

test('distance: returns number', () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const d = ops.distance(a, b);
  assert(typeof d === 'number', 'Should return number');
});

// move tests
test('move: basic move', () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const r = ops.move(a, b);
  assertEqual(r[0], 4);
  assertEqual(r[1], 6);
});

test('move: zero delta', () => {
  const a = new Float32Array([1, 2]);
  const zero = new Float32Array([0, 0]);
  const r = ops.move(a, zero);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
});

test('move: equivalence to add', () => {
  const a = new Float32Array([1, 2, 3]);
  const b = new Float32Array([4, 5, 6]);
  const moved = ops.move(a, b);
  const added = ops.add(a, b);
  for (let i = 0; i < 3; i++) {
    assertEqual(moved[i], added[i], `Element ${i} should be equal`);
  }
});

// modulate tests
test('modulate: with scalar', () => {
  const v = new Float32Array([4, 6]);
  const r = ops.modulate(v, 0.5);
  assertEqual(r[0], 2);
  assertEqual(r[1], 3);
});

test('modulate: with vector (Hadamard)', () => {
  const v = new Float32Array([4, 6]);
  const m = new Float32Array([0.5, 0.5]);
  const r = ops.modulate(v, m);
  assertEqual(r[0], 2);
  assertEqual(r[1], 3);
});

test('modulate: zero scalar', () => {
  const v = new Float32Array([1, 2]);
  const r = ops.modulate(v, 0);
  assertEqual(r[0], 0);
  assertEqual(r[1], 0);
});

test('modulate: full gate (scalar 1)', () => {
  const v = new Float32Array([1, 2]);
  const r = ops.modulate(v, 1);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
});

// identity tests
test('identity: returns same values', () => {
  const v = new Float32Array([1, 2, 3]);
  const r = ops.identity(v);
  for (let i = 0; i < 3; i++) {
    assertEqual(r[i], v[i], `Element ${i} should match`);
  }
});

test('identity: creates new array', () => {
  const v = new Float32Array([1, 2, 3]);
  const r = ops.identity(v);
  r[0] = 999;
  assertEqual(v[0], 1, 'Original should be unchanged');
});

// normalise tests
test('normalise: produces unit vector', () => {
  const v = new Float32Array([3, 4]);
  const r = ops.normalise(v);
  const norm = Math.sqrt(r[0] * r[0] + r[1] * r[1]);
  assertClose(norm, 1);
});

// isKernelVerb tests
test('isKernelVerb: recognizes Add', () => {
  assert(ops.isKernelVerb('Add'), 'Add should be kernel verb');
});

test('isKernelVerb: recognizes Modulate', () => {
  assert(ops.isKernelVerb('Modulate'), 'Modulate should be kernel verb');
});

test('isKernelVerb: rejects custom verbs', () => {
  assert(!ops.isKernelVerb('CustomVerb'), 'CustomVerb should not be kernel verb');
});

test('isKernelVerb: recognizes all kernel verbs', () => {
  const expected = ['Add', 'Bind', 'Negate', 'Distance', 'Move', 'Modulate', 'Identity', 'Normalise'];
  for (const verb of expected) {
    assert(ops.isKernelVerb(verb), `${verb} should be kernel verb`);
  }
});

// getKernelVerb tests
test('getKernelVerb: returns function for valid verb', () => {
  const fn = ops.getKernelVerb('Add');
  assert(typeof fn === 'function', 'Should return function');
});

test('getKernelVerb: returns undefined for invalid verb', () => {
  const fn = ops.getKernelVerb('InvalidVerb');
  assertEqual(fn, undefined, 'Should return undefined');
});

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`primitiveOps.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
