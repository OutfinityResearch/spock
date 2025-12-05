/**
 * @fileoverview Unit tests for primitiveOps.js
 *
 * Tests: DS Kernel Architecture - Primitive Geometric Operations
 * Specs: URS-003, FS-02, FS-03, DS Kernel
 *
 * These operations implement the core verb semantics for SpockDSL:
 * - Add: Superposition of concepts
 * - Bind: Associative binding (Hadamard product)
 * - Negate: Logical negation (vector flip)
 * - Distance: Cosine similarity for truth alignment
 * - Move: State transition (equivalent to Add)
 * - Modulate: Scaling/gating (polymorphic: scalar or vector)
 * - Identity: Pass-through
 * - Normalise: Unit vector projection
 */

'use strict';

const {
  suite,
  category,
  test,
  skip,
  assert,
  assertEqual,
  assertClose,
  assertVectorClose,
  assertType,
  exit
} = require('../testFramework');

const ops = require('../../src/kernel/primitiveOps');

// ============== TEST SUITE ==============

suite('primitiveOps.js', {
  file: 'src/kernel/primitiveOps.js',
  specs: ['URS-003', 'FS-02', 'FS-03', 'DS-Kernel']
});

// ============== Add ==============

category('Add - Vector Superposition');

test('basic addition: [1,2] + [3,4] = [4,6]', {
  input: 'add([1,2], [3,4])',
  expected: '[4, 6]',
  spec: 'DS-Kernel'
}, () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const r = ops.add(a, b);
  assertEqual(r[0], 4);
  assertEqual(r[1], 6);
});

test('commutativity: add(a,b) = add(b,a)', {
  input: 'add([1,2,3], [4,5,6]) vs add([4,5,6], [1,2,3])',
  expected: 'Same result'
}, () => {
  const a = new Float32Array([1, 2, 3]);
  const b = new Float32Array([4, 5, 6]);
  const r1 = ops.add(a, b);
  const r2 = ops.add(b, a);
  for (let i = 0; i < 3; i++) {
    assertEqual(r1[i], r2[i], `Element ${i} should be equal`);
  }
});

test('identity: add(v, zero) = v', {
  input: 'add([1,2], [0,0])',
  expected: '[1, 2]'
}, () => {
  const a = new Float32Array([1, 2]);
  const zero = new Float32Array([0, 0]);
  const r = ops.add(a, zero);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
});

test('cancellation: add([1,-2], [-1,2]) = [0,0]', {
  input: 'add([1,-2], [-1,2])',
  expected: '[0, 0]'
}, () => {
  const a = new Float32Array([1, -2]);
  const b = new Float32Array([-1, 2]);
  const r = ops.add(a, b);
  assertEqual(r[0], 0);
  assertEqual(r[1], 0);
});

// ============== Bind ==============

category('Bind - Associative Binding (Hadamard Product)');

test('element-wise product: bind([2,3], [4,5]) = [8,15]', {
  input: 'bind([2,3], [4,5])',
  expected: '[8, 15]',
  spec: 'DS-Kernel'
}, () => {
  const a = new Float32Array([2, 3]);
  const b = new Float32Array([4, 5]);
  const r = ops.bind(a, b);
  assertEqual(r[0], 8);
  assertEqual(r[1], 15);
});

test('identity: bind(v, ones) = v', {
  input: 'bind([1,2], [1,1])',
  expected: '[1, 2]'
}, () => {
  const a = new Float32Array([1, 2]);
  const ones = new Float32Array([1, 1]);
  const r = ops.bind(a, ones);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
});

test('zero element: bind([1,2], [0,1]) = [0,2]', {
  input: 'bind([1,2], [0,1])',
  expected: '[0, 2]'
}, () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([0, 1]);
  const r = ops.bind(a, b);
  assertEqual(r[0], 0);
  assertEqual(r[1], 2);
});

test('commutativity: bind(a,b) = bind(b,a)', {
  input: 'bind([2,3], [4,5]) vs bind([4,5], [2,3])',
  expected: 'Same result'
}, () => {
  const a = new Float32Array([2, 3]);
  const b = new Float32Array([4, 5]);
  const r1 = ops.bind(a, b);
  const r2 = ops.bind(b, a);
  assertEqual(r1[0], r2[0]);
  assertEqual(r1[1], r2[1]);
});

// ============== Negate ==============

category('Negate - Logical Negation');

test('basic negation: negate([1,-2]) = [-1,2]', {
  input: 'negate([1,-2])',
  expected: '[-1, 2]',
  spec: 'DS-Kernel'
}, () => {
  const v = new Float32Array([1, -2]);
  const r = ops.negate(v);
  assertEqual(r[0], -1);
  assertEqual(r[1], 2);
});

test('double negation: negate(negate(v)) = v', {
  input: 'negate(negate([1,2,3]))',
  expected: '[1, 2, 3]'
}, () => {
  const v = new Float32Array([1, 2, 3]);
  const r = ops.negate(ops.negate(v));
  for (let i = 0; i < 3; i++) {
    assertClose(r[i], v[i]);
  }
});

test('zero vector: negate([0,0]) = [0,0]', {
  input: 'negate([0,0])',
  expected: '[0, 0]'
}, () => {
  const v = new Float32Array([0, 0]);
  const r = ops.negate(v);
  assertEqual(r[0], 0);
  assertEqual(r[1], 0);
});

test('negate preserves magnitude', {
  input: 'norm(negate(v)) vs norm(v)',
  expected: 'Same magnitude'
}, () => {
  const v = new Float32Array([3, 4]);
  const neg = ops.negate(v);
  // Calculate norms manually
  const normV = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  const normNeg = Math.sqrt(neg[0] * neg[0] + neg[1] * neg[1]);
  assertClose(normV, normNeg);
});

// ============== Distance ==============

category('Distance - Cosine Similarity');

test('identical vectors → max similarity (1)', {
  input: 'distance(v, v)',
  expected: '1 (cosine similarity)',
  spec: 'DS-Kernel'
}, () => {
  const v = new Float32Array([1, 2, 3]);
  const d = ops.distance(v, v);
  assertClose(d, 1);
});

test('symmetry: distance(a,b) = distance(b,a)', {
  input: 'distance([1,2], [3,4]) vs distance([3,4], [1,2])',
  expected: 'Same value'
}, () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const d1 = ops.distance(a, b);
  const d2 = ops.distance(b, a);
  assertClose(d1, d2);
});

test('orthogonal vectors → 0.5 (normalized)', {
  input: 'distance([1,0], [0,1])',
  expected: '0.5 (cosine=0, normalized to [0,1])',
  spec: 'FS-01'
}, () => {
  const a = new Float32Array([1, 0]);
  const b = new Float32Array([0, 1]);
  const d = ops.distance(a, b);
  // Distance returns (cosineSim + 1) / 2 normalized to [0, 1]
  assertClose(d, 0.5);
});

test('returns scalar (number)', {
  input: 'typeof distance([1,2], [3,4])',
  expected: 'number'
}, () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const d = ops.distance(a, b);
  assertType(d, 'number', 'Distance should return number');
});

test('range is [0, 1]', {
  input: 'distance values',
  expected: '0 ≤ d ≤ 1'
}, () => {
  const a = new Float32Array([1, 0]);
  const b = new Float32Array([-1, 0]);
  const d = ops.distance(a, b);
  assert(d >= 0 && d <= 1, `Distance ${d} should be in [0,1]`);
});

// ============== Move ==============

category('Move - State Transition');

test('basic move: move([1,2], [3,4]) = [4,6]', {
  input: 'move([1,2], [3,4])',
  expected: '[4, 6]',
  spec: 'DS-Kernel'
}, () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const r = ops.move(a, b);
  assertEqual(r[0], 4);
  assertEqual(r[1], 6);
});

test('zero delta: move(v, zero) = v', {
  input: 'move([1,2], [0,0])',
  expected: '[1, 2]'
}, () => {
  const a = new Float32Array([1, 2]);
  const zero = new Float32Array([0, 0]);
  const r = ops.move(a, zero);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
});

test('equivalence to add: move(a,b) = add(a,b)', {
  input: 'move([1,2,3], [4,5,6]) vs add([1,2,3], [4,5,6])',
  expected: 'Same result'
}, () => {
  const a = new Float32Array([1, 2, 3]);
  const b = new Float32Array([4, 5, 6]);
  const moved = ops.move(a, b);
  const added = ops.add(a, b);
  for (let i = 0; i < 3; i++) {
    assertEqual(moved[i], added[i], `Element ${i} should be equal`);
  }
});

// ============== Modulate ==============

category('Modulate - Polymorphic Scaling');

test('with scalar: modulate([4,6], 0.5) = [2,3]', {
  input: 'modulate([4,6], 0.5)',
  expected: '[2, 3]',
  spec: 'FS-02'
}, () => {
  const v = new Float32Array([4, 6]);
  const r = ops.modulate(v, 0.5);
  assertEqual(r[0], 2);
  assertEqual(r[1], 3);
});

test('with vector (Hadamard): modulate([4,6], [0.5,0.5]) = [2,3]', {
  input: 'modulate([4,6], [0.5,0.5])',
  expected: '[2, 3]',
  spec: 'FS-02'
}, () => {
  const v = new Float32Array([4, 6]);
  const m = new Float32Array([0.5, 0.5]);
  const r = ops.modulate(v, m);
  assertEqual(r[0], 2);
  assertEqual(r[1], 3);
});

test('zero scalar: modulate(v, 0) = zero', {
  input: 'modulate([1,2], 0)',
  expected: '[0, 0]'
}, () => {
  const v = new Float32Array([1, 2]);
  const r = ops.modulate(v, 0);
  assertEqual(r[0], 0);
  assertEqual(r[1], 0);
});

test('full gate (scalar 1): modulate(v, 1) = v', {
  input: 'modulate([1,2], 1)',
  expected: '[1, 2]'
}, () => {
  const v = new Float32Array([1, 2]);
  const r = ops.modulate(v, 1);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
});

test('negative scalar: modulate([1,2], -1) = [-1,-2]', {
  input: 'modulate([1,2], -1)',
  expected: '[-1, -2]'
}, () => {
  const v = new Float32Array([1, 2]);
  const r = ops.modulate(v, -1);
  assertEqual(r[0], -1);
  assertEqual(r[1], -2);
});

// ============== Identity ==============

category('Identity - Pass-through');

test('returns same values', {
  input: 'identity([1,2,3])',
  expected: '[1, 2, 3]',
  spec: 'FS-02'
}, () => {
  const v = new Float32Array([1, 2, 3]);
  const r = ops.identity(v);
  for (let i = 0; i < 3; i++) {
    assertEqual(r[i], v[i], `Element ${i} should match`);
  }
});

test('creates new array (no mutation)', {
  input: 'identity(v) !== v',
  expected: 'Different object'
}, () => {
  const v = new Float32Array([1, 2, 3]);
  const r = ops.identity(v);
  r[0] = 999;
  assertEqual(v[0], 1, 'Original should be unchanged');
});

// ============== Normalise ==============

category('Normalise - Unit Vector Projection');

test('produces unit vector', {
  input: 'normalise([3,4])',
  expected: 'norm = 1',
  spec: 'DS-Kernel'
}, () => {
  const v = new Float32Array([3, 4]);
  const r = ops.normalise(v);
  const norm = Math.sqrt(r[0] * r[0] + r[1] * r[1]);
  assertClose(norm, 1);
});

test('preserves direction', {
  input: 'normalise([3,4])',
  expected: '[0.6, 0.8]'
}, () => {
  const v = new Float32Array([3, 4]);
  const r = ops.normalise(v);
  assertClose(r[0], 0.6);
  assertClose(r[1], 0.8);
});

// ============== Verb Registry ==============

category('Verb Registry - isKernelVerb / getKernelVerb');

test('recognizes Add', {
  input: 'isKernelVerb("Add")',
  expected: 'true',
  spec: 'FS-02'
}, () => {
  assert(ops.isKernelVerb('Add'), 'Add should be kernel verb');
});

test('recognizes Modulate', {
  input: 'isKernelVerb("Modulate")',
  expected: 'true'
}, () => {
  assert(ops.isKernelVerb('Modulate'), 'Modulate should be kernel verb');
});

test('rejects custom verbs', {
  input: 'isKernelVerb("CustomVerb")',
  expected: 'false'
}, () => {
  assert(!ops.isKernelVerb('CustomVerb'), 'CustomVerb should not be kernel verb');
});

test('recognizes all 8 kernel verbs', {
  input: 'isKernelVerb for all kernel verbs',
  expected: 'All return true'
}, () => {
  const expected = ['Add', 'Bind', 'Negate', 'Distance', 'Move', 'Modulate', 'Identity', 'Normalise'];
  for (const verb of expected) {
    assert(ops.isKernelVerb(verb), `${verb} should be kernel verb`);
  }
});

test('getKernelVerb returns function for valid verb', {
  input: 'getKernelVerb("Add")',
  expected: 'function'
}, () => {
  const fn = ops.getKernelVerb('Add');
  assertType(fn, 'function', 'Should return function');
});

test('getKernelVerb returns undefined for invalid verb', {
  input: 'getKernelVerb("InvalidVerb")',
  expected: 'undefined'
}, () => {
  const fn = ops.getKernelVerb('InvalidVerb');
  assert(fn === undefined || fn === null, 'Should return undefined or null');
});

// ============== Exit ==============

exit();
