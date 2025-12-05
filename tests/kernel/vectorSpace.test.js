/**
 * @fileoverview Unit tests for vectorSpace.js
 *
 * Tests: DS Kernel Architecture - Vector Space Management
 * Specs: URS-003, URS-006, FS-01, DS Kernel
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
  assertInstance,
  exit
} = require('../testFramework');

const vectorSpace = require('../../src/kernel/vectorSpace');

// ============== TEST SUITE ==============

suite('vectorSpace.js', {
  file: 'src/kernel/vectorSpace.js',
  specs: ['URS-003', 'URS-006', 'FS-01', 'DS-Kernel']
});

// ============== createVector ==============

category('createVector - Zero Vector Allocation');

test('creates Float32Array with correct dimension', {
  input: 'createVector(512)',
  expected: 'Float32Array of length 512',
  spec: 'FS-01'
}, () => {
  const v = vectorSpace.createVector(512);
  assertEqual(v.length, 512, 'Dimension mismatch');
  assertInstance(v, Float32Array, 'Should be Float32Array');
});

test('initializes all elements to zero', {
  input: 'createVector(10)',
  expected: 'All elements are 0'
}, () => {
  const v = vectorSpace.createVector(10);
  for (let i = 0; i < 10; i++) {
    assertEqual(v[i], 0, `Element ${i} should be 0`);
  }
});

test('handles minimal dimension (1)', {
  input: 'createVector(1)',
  expected: 'Single-element Float32Array [0]'
}, () => {
  const v = vectorSpace.createVector(1);
  assertEqual(v.length, 1);
  assertEqual(v[0], 0);
});

test('handles large dimensions', {
  input: 'createVector(4096)',
  expected: 'Float32Array of length 4096'
}, () => {
  const v = vectorSpace.createVector(4096);
  assertEqual(v.length, 4096);
  assertEqual(v[0], 0);
  assertEqual(v[4095], 0);
});

// ============== createRandomVector ==============

category('createRandomVector - Random Hypervector Generation');

test('creates non-zero random vector', {
  input: 'createRandomVector(100)',
  expected: 'Vector with non-zero elements',
  spec: 'DS-Kernel'
}, () => {
  const v = vectorSpace.createRandomVector(100);
  assertEqual(v.length, 100);
  const sum = v.reduce((a, b) => a + Math.abs(b), 0);
  assert(sum > 0, 'Random vector should have non-zero elements');
});

test('produces different vectors with different seeds', {
  input: 'seed=1 vs seed=2',
  expected: 'Different vectors',
  spec: 'NFS-01'
}, () => {
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

test('produces reproducible vectors with same seed', {
  input: 'seed=42 twice',
  expected: 'Identical vectors',
  spec: 'NFS-01'
}, () => {
  vectorSpace.setRandomSeed(42);
  const v1 = vectorSpace.createRandomVector(10);
  vectorSpace.setRandomSeed(42);
  const v2 = vectorSpace.createRandomVector(10);

  for (let i = 0; i < 10; i++) {
    assertEqual(v1[i], v2[i], `Element ${i} should match with same seed`);
  }
});

// ============== cloneVector ==============

category('cloneVector - Deep Copy');

test('creates deep copy with same values', {
  input: 'cloneVector([1,2,3,4,5])',
  expected: 'New array with identical values'
}, () => {
  const original = new Float32Array([1, 2, 3, 4, 5]);
  const clone = vectorSpace.cloneVector(original);

  assertEqual(clone.length, original.length, 'Length should match');
  for (let i = 0; i < original.length; i++) {
    assertEqual(clone[i], original[i], `Element ${i} should match`);
  }
});

test('modifications to clone do not affect original', {
  input: 'Modify clone[0] = 999',
  expected: 'Original[0] unchanged'
}, () => {
  const original = new Float32Array([1, 2, 3]);
  const clone = vectorSpace.cloneVector(original);

  clone[0] = 999;
  assertEqual(original[0], 1, 'Original should be unchanged');
});

test('clone is a new object', {
  input: 'cloneVector(v)',
  expected: 'v !== clone'
}, () => {
  const original = new Float32Array([1, 2, 3]);
  const clone = vectorSpace.cloneVector(original);
  assert(original !== clone, 'Clone should be a different object');
});

// ============== dot (inner product) ==============

category('dot - Inner Product');

test('orthogonal vectors → 0', {
  input: 'dot([1,0], [0,1])',
  expected: '0',
  spec: 'DS-Kernel'
}, () => {
  const a = new Float32Array([1, 0]);
  const b = new Float32Array([0, 1]);
  assertClose(vectorSpace.dot(a, b), 0);
});

test('parallel vectors → sum of squares', {
  input: 'dot([1,2], [1,2])',
  expected: '1*1 + 2*2 = 5'
}, () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([1, 2]);
  assertEqual(vectorSpace.dot(a, b), 5);
});

test('zero vector → 0', {
  input: 'dot([0,0], [1,1])',
  expected: '0'
}, () => {
  const a = new Float32Array([0, 0]);
  const b = new Float32Array([1, 1]);
  assertEqual(vectorSpace.dot(a, b), 0);
});

test('negative values', {
  input: 'dot([1,-1], [-1,1])',
  expected: '1*(-1) + (-1)*1 = -2'
}, () => {
  const a = new Float32Array([1, -1]);
  const b = new Float32Array([-1, 1]);
  assertEqual(vectorSpace.dot(a, b), -2);
});

test('commutativity: dot(a,b) = dot(b,a)', {
  input: 'dot([1,2,3], [4,5,6]) vs dot([4,5,6], [1,2,3])',
  expected: 'Same value'
}, () => {
  const a = new Float32Array([1, 2, 3]);
  const b = new Float32Array([4, 5, 6]);
  assertEqual(vectorSpace.dot(a, b), vectorSpace.dot(b, a));
});

test('higher dimensions', {
  input: 'dot([1,2,3,4,5], [2,2,2,2,2])',
  expected: '1*2 + 2*2 + 3*2 + 4*2 + 5*2 = 30'
}, () => {
  const a = new Float32Array([1, 2, 3, 4, 5]);
  const b = new Float32Array([2, 2, 2, 2, 2]);
  assertEqual(vectorSpace.dot(a, b), 30);
});

// ============== norm (Euclidean length) ==============

category('norm - Euclidean Length');

test('unit vector → 1', {
  input: 'norm([1,0,0])',
  expected: '1',
  spec: 'FS-01'
}, () => {
  const v = new Float32Array([1, 0, 0]);
  assertClose(vectorSpace.norm(v), 1);
});

test('zero vector → 0', {
  input: 'norm([0,0,0])',
  expected: '0'
}, () => {
  const v = new Float32Array([0, 0, 0]);
  assertEqual(vectorSpace.norm(v), 0);
});

test('3-4-5 triangle → 5', {
  input: 'norm([3,4])',
  expected: 'sqrt(9+16) = 5'
}, () => {
  const v = new Float32Array([3, 4]);
  assertEqual(vectorSpace.norm(v), 5);
});

test('general vector', {
  input: 'norm([1,2,2])',
  expected: 'sqrt(1+4+4) = 3'
}, () => {
  const v = new Float32Array([1, 2, 2]);
  assertEqual(vectorSpace.norm(v), 3);
});

// ============== normalise ==============

category('normalise - Unit Vector Conversion');

test('non-zero vector → unit length', {
  input: 'normalise([3,4])',
  expected: '[0.6, 0.8] with norm = 1',
  spec: 'DS-Kernel'
}, () => {
  const v = new Float32Array([3, 4]);
  const n = vectorSpace.normalise(v);
  assertClose(n[0], 0.6);
  assertClose(n[1], 0.8);
  assertClose(vectorSpace.norm(n), 1);
});

test('already normalized → unchanged', {
  input: 'normalise([1,0])',
  expected: '[1, 0]'
}, () => {
  const v = new Float32Array([1, 0]);
  const n = vectorSpace.normalise(v);
  assertClose(n[0], 1);
  assertClose(n[1], 0);
});

test('zero vector → zero (no NaN)', {
  input: 'normalise([0,0])',
  expected: '[0, 0] without NaN'
}, () => {
  const v = new Float32Array([0, 0]);
  const n = vectorSpace.normalise(v);
  assert(!isNaN(n[0]), 'Should not produce NaN');
  assert(!isNaN(n[1]), 'Should not produce NaN');
});

test('idempotent: normalise(normalise(v)) = normalise(v)', {
  input: 'normalise(normalise([3,4,5]))',
  expected: 'Same as normalise([3,4,5])'
}, () => {
  const v = new Float32Array([3, 4, 5]);
  const n1 = vectorSpace.normalise(v);
  const n2 = vectorSpace.normalise(n1);
  assertVectorClose(n1, n2);
});

test('result has unit length', {
  input: 'norm(normalise([1,2,3,4,5]))',
  expected: '≈ 1'
}, () => {
  const v = new Float32Array([1, 2, 3, 4, 5]);
  const n = vectorSpace.normalise(v);
  assertClose(vectorSpace.norm(n), 1);
});

// ============== cosineSimilarity ==============

category('cosineSimilarity - Angular Distance');

test('identical vectors → 1', {
  input: 'cosineSimilarity(v, v)',
  expected: '1 (perfect alignment)',
  spec: 'DS-Kernel'
}, () => {
  const v = new Float32Array([1, 2, 3]);
  assertClose(vectorSpace.cosineSimilarity(v, v), 1);
});

test('opposite vectors → -1', {
  input: 'cosineSimilarity([1,0], [-1,0])',
  expected: '-1 (antiparallel)'
}, () => {
  const a = new Float32Array([1, 0]);
  const b = new Float32Array([-1, 0]);
  assertClose(vectorSpace.cosineSimilarity(a, b), -1);
});

test('orthogonal vectors → 0', {
  input: 'cosineSimilarity([1,0], [0,1])',
  expected: '0 (perpendicular)'
}, () => {
  const a = new Float32Array([1, 0]);
  const b = new Float32Array([0, 1]);
  assertClose(vectorSpace.cosineSimilarity(a, b), 0);
});

test('scaled vectors → same similarity', {
  input: 'cosineSimilarity([1,2], [2,4])',
  expected: '1 (same direction)'
}, () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([2, 4]);
  assertClose(vectorSpace.cosineSimilarity(a, b), 1);
});

// ============== scale ==============

category('scale - Scalar Multiplication');

test('basic scaling', {
  input: 'scale([2,4,6], 0.5)',
  expected: '[1, 2, 3]'
}, () => {
  const v = new Float32Array([2, 4, 6]);
  const s = vectorSpace.scale(v, 0.5);
  assertEqual(s[0], 1);
  assertEqual(s[1], 2);
  assertEqual(s[2], 3);
});

test('zero scalar → zero vector', {
  input: 'scale([1,2,3], 0)',
  expected: '[0, 0, 0]'
}, () => {
  const v = new Float32Array([1, 2, 3]);
  const s = vectorSpace.scale(v, 0);
  assertEqual(s[0], 0);
  assertEqual(s[1], 0);
  assertEqual(s[2], 0);
});

test('scale by 1 → same values', {
  input: 'scale([1,2,3], 1)',
  expected: '[1, 2, 3]'
}, () => {
  const v = new Float32Array([1, 2, 3]);
  const s = vectorSpace.scale(v, 1);
  assertEqual(s[0], 1);
  assertEqual(s[1], 2);
  assertEqual(s[2], 3);
});

test('negative scaling', {
  input: 'scale([1,2,3], -1)',
  expected: '[-1, -2, -3]'
}, () => {
  const v = new Float32Array([1, 2, 3]);
  const s = vectorSpace.scale(v, -1);
  assertEqual(s[0], -1);
  assertEqual(s[1], -2);
  assertEqual(s[2], -3);
});

// ============== addVectors ==============

category('addVectors - Element-wise Addition');

test('basic addition', {
  input: 'addVectors([1,2], [3,4])',
  expected: '[4, 6]',
  spec: 'DS-Kernel'
}, () => {
  const a = new Float32Array([1, 2]);
  const b = new Float32Array([3, 4]);
  const r = vectorSpace.addVectors(a, b);
  assertEqual(r[0], 4);
  assertEqual(r[1], 6);
});

test('adding zero vector → unchanged', {
  input: 'addVectors([1,2,3], [0,0,0])',
  expected: '[1, 2, 3]'
}, () => {
  const a = new Float32Array([1, 2, 3]);
  const zero = new Float32Array([0, 0, 0]);
  const r = vectorSpace.addVectors(a, zero);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
  assertEqual(r[2], 3);
});

// ============== hadamard (element-wise product) ==============

category('hadamard - Element-wise Product (Bind)');

test('element-wise multiplication', {
  input: 'hadamard([2,3], [4,5])',
  expected: '[8, 15]',
  spec: 'DS-Kernel'
}, () => {
  const a = new Float32Array([2, 3]);
  const b = new Float32Array([4, 5]);
  const r = vectorSpace.hadamard(a, b);
  assertEqual(r[0], 8);
  assertEqual(r[1], 15);
});

test('identity (ones)', {
  input: 'hadamard([1,2,3], [1,1,1])',
  expected: '[1, 2, 3]'
}, () => {
  const a = new Float32Array([1, 2, 3]);
  const ones = new Float32Array([1, 1, 1]);
  const r = vectorSpace.hadamard(a, ones);
  assertEqual(r[0], 1);
  assertEqual(r[1], 2);
  assertEqual(r[2], 3);
});

test('zero element produces zero', {
  input: 'hadamard([5,6,7], [0,1,1])',
  expected: '[0, 6, 7]'
}, () => {
  const a = new Float32Array([5, 6, 7]);
  const b = new Float32Array([0, 1, 1]);
  const r = vectorSpace.hadamard(a, b);
  assertEqual(r[0], 0);
  assertEqual(r[1], 6);
  assertEqual(r[2], 7);
});

// ============== Exit ==============

exit();
