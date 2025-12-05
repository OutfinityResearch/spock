/**
 * @fileoverview Unit tests for numericKernel.js
 *
 * Tests: DS Numeric Kernel - Runtime Numeric Operations with Units
 * Specs: URS-003, FS-05, DS-Numeric
 *
 * The numeric kernel provides:
 * - makeNumeric: Create numeric values from raw numbers
 * - attachUnit: Add physical units to numerics
 * - addNumeric/subNumeric: Unit-aware arithmetic
 * - mulNumeric/divNumeric: Unit composition operations
 * - attachToConcept/projectNumeric: Concept linking
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
  assertThrows,
  assertType,
  exit
} = require('../testFramework');

const {
  makeNumeric,
  attachUnit,
  addNumeric,
  subNumeric,
  mulNumeric,
  divNumeric,
  attachToConcept,
  projectNumeric,
  isNumericVerb,
  getNumericVerb
} = require('../../src/kernel/numericKernel');

// ============== TEST SUITE ==============

suite('numericKernel.js', {
  file: 'src/kernel/numericKernel.js',
  specs: ['URS-003', 'FS-05', 'DS-Numeric']
});

// ============== makeNumeric ==============

category('makeNumeric - Numeric Value Creation');

test('creates numeric value from integer', {
  input: 'makeNumeric(42)',
  expected: '{type: "NUMERIC", value: 42, unit: null}',
  spec: 'FS-05'
}, () => {
  const n = makeNumeric(42);
  assertEqual(n.type, 'NUMERIC');
  assertEqual(n.value, 42);
  assertEqual(n.unit, null);
});

test('creates numeric value from float', {
  input: 'makeNumeric(3.14)',
  expected: '{type: "NUMERIC", value: 3.14, unit: null}'
}, () => {
  const n = makeNumeric(3.14);
  assertEqual(n.type, 'NUMERIC');
  assertClose(n.value, 3.14);
});

test('creates numeric value from zero', {
  input: 'makeNumeric(0)',
  expected: '{type: "NUMERIC", value: 0, unit: null}'
}, () => {
  const n = makeNumeric(0);
  assertEqual(n.value, 0);
});

test('creates numeric value from negative', {
  input: 'makeNumeric(-5)',
  expected: '{type: "NUMERIC", value: -5, unit: null}'
}, () => {
  const n = makeNumeric(-5);
  assertEqual(n.value, -5);
});

test('throws for NaN', {
  input: 'makeNumeric(NaN)',
  expected: 'Error'
}, () => {
  assertThrows(() => makeNumeric(NaN), 'Invalid');
});

test('throws for Infinity', {
  input: 'makeNumeric(Infinity)',
  expected: 'Error'
}, () => {
  assertThrows(() => makeNumeric(Infinity), 'Invalid');
});

// ============== attachUnit ==============

category('attachUnit - Unit Attachment');

test('adds unit to numeric', {
  input: 'attachUnit({value: 5}, "kg")',
  expected: '{unit: "kg"}',
  spec: 'FS-05'
}, () => {
  const n = makeNumeric(5);
  const withUnit = attachUnit(n, 'kg');
  assertEqual(withUnit.unit, 'kg');
  assertEqual(withUnit.value, 5);
});

test('replaces existing unit', {
  input: 'attachUnit({unit: "kg"}, "m")',
  expected: '{unit: "m"}'
}, () => {
  const n = makeNumeric(10);
  const kg = attachUnit(n, 'kg');
  const m = attachUnit(kg, 'm');
  assertEqual(m.unit, 'm');
});

test('preserves value when adding unit', {
  input: 'attachUnit({value: 42}, "s")',
  expected: '{value: 42}'
}, () => {
  const n = makeNumeric(42);
  const withUnit = attachUnit(n, 's');
  assertEqual(withUnit.value, 42);
});

// ============== addNumeric ==============

category('addNumeric - Addition with Units');

test('adds two unitless numerics', {
  input: 'addNumeric(3, 4)',
  expected: '7',
  spec: 'FS-05'
}, () => {
  const a = makeNumeric(3);
  const b = makeNumeric(4);
  const r = addNumeric(a, b);
  assertEqual(r.value, 7);
});

test('adds two floats', {
  input: 'addNumeric(1.5, 2.5)',
  expected: '4.0'
}, () => {
  const a = makeNumeric(1.5);
  const b = makeNumeric(2.5);
  const r = addNumeric(a, b);
  assertClose(r.value, 4.0);
});

test('preserves unit from first operand', {
  input: 'addNumeric({value: 3, unit: "kg"}, {value: 2, unit: null})',
  expected: '{value: 5, unit: "kg"}'
}, () => {
  const a = attachUnit(makeNumeric(3), 'kg');
  const b = makeNumeric(2);
  const r = addNumeric(a, b);
  assertEqual(r.unit, 'kg');
});

test('preserves unit from second operand if first has none', {
  input: 'addNumeric({unit: null}, {unit: "m"})',
  expected: '{unit: "m"}'
}, () => {
  const a = makeNumeric(3);
  const b = attachUnit(makeNumeric(2), 'm');
  const r = addNumeric(a, b);
  assertEqual(r.unit, 'm');
});

test('throws for incompatible units', {
  input: 'addNumeric({unit: "kg"}, {unit: "m"})',
  expected: 'Error: Incompatible units'
}, () => {
  const a = attachUnit(makeNumeric(3), 'kg');
  const b = attachUnit(makeNumeric(2), 'm');
  assertThrows(() => addNumeric(a, b), 'Incompatible');
});

// ============== subNumeric ==============

category('subNumeric - Subtraction with Units');

test('subtracts two numerics', {
  input: 'subNumeric(5, 3)',
  expected: '2',
  spec: 'FS-05'
}, () => {
  const a = makeNumeric(5);
  const b = makeNumeric(3);
  const r = subNumeric(a, b);
  assertEqual(r.value, 2);
});

test('handles negative result', {
  input: 'subNumeric(3, 5)',
  expected: '-2'
}, () => {
  const a = makeNumeric(3);
  const b = makeNumeric(5);
  const r = subNumeric(a, b);
  assertEqual(r.value, -2);
});

test('preserves unit', {
  input: 'subNumeric({unit: "m"}, {unit: "m"})',
  expected: '{unit: "m"}'
}, () => {
  const a = attachUnit(makeNumeric(10), 'm');
  const b = attachUnit(makeNumeric(3), 'm');
  const r = subNumeric(a, b);
  assertEqual(r.unit, 'm');
});

// ============== mulNumeric ==============

category('mulNumeric - Multiplication with Unit Composition');

test('multiplies two numerics', {
  input: 'mulNumeric(3, 4)',
  expected: '12',
  spec: 'FS-05'
}, () => {
  const a = makeNumeric(3);
  const b = makeNumeric(4);
  const r = mulNumeric(a, b);
  assertEqual(r.value, 12);
});

test('handles zero', {
  input: 'mulNumeric(5, 0)',
  expected: '0'
}, () => {
  const a = makeNumeric(5);
  const b = makeNumeric(0);
  const r = mulNumeric(a, b);
  assertEqual(r.value, 0);
});

test('composes units: m * m = m2', {
  input: 'mulNumeric({unit: "m"}, {unit: "m"})',
  expected: '{unit: "m2"}'
}, () => {
  const a = attachUnit(makeNumeric(2), 'm');
  const b = attachUnit(makeNumeric(3), 'm');
  const r = mulNumeric(a, b);
  assertEqual(r.unit, 'm2');
});

test('composes units: kg * m_per_s2 = N', {
  input: 'mulNumeric({unit: "kg"}, {unit: "m_per_s2"})',
  expected: '{unit: "N"}'
}, () => {
  const a = attachUnit(makeNumeric(2), 'kg');
  const b = attachUnit(makeNumeric(10), 'm_per_s2');
  const r = mulNumeric(a, b);
  assertEqual(r.unit, 'N');
});

// ============== divNumeric ==============

category('divNumeric - Division with Unit Composition');

test('divides two numerics', {
  input: 'divNumeric(12, 4)',
  expected: '3',
  spec: 'FS-05'
}, () => {
  const a = makeNumeric(12);
  const b = makeNumeric(4);
  const r = divNumeric(a, b);
  assertEqual(r.value, 3);
});

test('handles fractional result', {
  input: 'divNumeric(10, 4)',
  expected: '2.5'
}, () => {
  const a = makeNumeric(10);
  const b = makeNumeric(4);
  const r = divNumeric(a, b);
  assertClose(r.value, 2.5);
});

test('throws for division by zero', {
  input: 'divNumeric(5, 0)',
  expected: 'Error: Division by zero'
}, () => {
  const a = makeNumeric(5);
  const b = makeNumeric(0);
  assertThrows(() => divNumeric(a, b), 'Division by zero');
});

test('composes units: m / s = m_per_s', {
  input: 'divNumeric({unit: "m"}, {unit: "s"})',
  expected: '{unit: "m_per_s"}'
}, () => {
  const a = attachUnit(makeNumeric(10), 'm');
  const b = attachUnit(makeNumeric(2), 's');
  const r = divNumeric(a, b);
  assertEqual(r.unit, 'm_per_s');
});

test('cancels same units', {
  input: 'divNumeric({unit: "m"}, {unit: "m"})',
  expected: '{unit: null}'
}, () => {
  const a = attachUnit(makeNumeric(10), 'm');
  const b = attachUnit(makeNumeric(2), 'm');
  const r = divNumeric(a, b);
  assertEqual(r.unit, null);
});

// ============== Verb Registry ==============

category('Verb Registry - isNumericVerb / getNumericVerb');

test('recognizes HasNumericValue', {
  input: 'isNumericVerb("HasNumericValue")',
  expected: 'true',
  spec: 'FS-05'
}, () => {
  assert(isNumericVerb('HasNumericValue'), 'HasNumericValue should be numeric verb');
});

test('recognizes AttachUnit', {
  input: 'isNumericVerb("AttachUnit")',
  expected: 'true'
}, () => {
  assert(isNumericVerb('AttachUnit'), 'AttachUnit should be numeric verb');
});

test('recognizes AddNumeric', {
  input: 'isNumericVerb("AddNumeric")',
  expected: 'true'
}, () => {
  assert(isNumericVerb('AddNumeric'), 'AddNumeric should be numeric verb');
});

test('recognizes SubNumeric', {
  input: 'isNumericVerb("SubNumeric")',
  expected: 'true'
}, () => {
  assert(isNumericVerb('SubNumeric'), 'SubNumeric should be numeric verb');
});

test('recognizes MulNumeric', {
  input: 'isNumericVerb("MulNumeric")',
  expected: 'true'
}, () => {
  assert(isNumericVerb('MulNumeric'), 'MulNumeric should be numeric verb');
});

test('recognizes DivNumeric', {
  input: 'isNumericVerb("DivNumeric")',
  expected: 'true'
}, () => {
  assert(isNumericVerb('DivNumeric'), 'DivNumeric should be numeric verb');
});

test('rejects non-numeric verbs', {
  input: 'isNumericVerb("Add")',
  expected: 'false'
}, () => {
  assert(!isNumericVerb('Add'), 'Add should not be numeric verb');
});

test('getNumericVerb returns function for valid verb', {
  input: 'getNumericVerb("AddNumeric")',
  expected: 'function'
}, () => {
  const fn = getNumericVerb('AddNumeric');
  assertType(fn, 'function', 'Should return function');
});

test('getNumericVerb returns null for invalid verb', {
  input: 'getNumericVerb("InvalidVerb")',
  expected: 'null'
}, () => {
  const fn = getNumericVerb('InvalidVerb');
  assertEqual(fn, null, 'Should return null for invalid verb');
});

// ============== Concept Attachment ==============

category('Concept Attachment - attachToConcept');

test('attaches numeric to concept vector', {
  input: 'attachToConcept({value: 42}, concept)',
  expected: '{type: "MEASURED", value: 42}',
  spec: 'FS-05'
}, () => {
  const n = makeNumeric(42);
  const concept = { type: 'VECTOR', value: new Float32Array([1, 2, 3]), name: 'Mass' };
  const measured = attachToConcept(n, concept);

  assertEqual(measured.type, 'MEASURED');
  assertEqual(measured.value, 42);
  assertEqual(measured.conceptName, 'Mass');
  assert(measured.conceptVector === concept.value, 'Should reference concept vector');
});

test('attaches numeric to concept by name', {
  input: 'attachToConcept({value: 42}, "Ball")',
  expected: '{type: "MEASURED", conceptName: "Ball"}',
  spec: 'FS-05'
}, () => {
  const n = makeNumeric(42);
  const measured = attachToConcept(n, 'Ball');

  assertEqual(measured.type, 'MEASURED');
  assertEqual(measured.value, 42);
  assertEqual(measured.conceptName, 'Ball');
  assertEqual(measured.conceptVector, null);  // Resolved later
});

test('attaches numeric with unit to concept', {
  input: 'attachToConcept({value: 10, unit: "kg"}, concept)',
  expected: '{type: "MEASURED", value: 10, unit: "kg"}'
}, () => {
  const n = attachUnit(makeNumeric(10), 'kg');
  const concept = { type: 'VECTOR', value: new Float32Array([1, 0, 0]), name: 'Weight' };
  const measured = attachToConcept(n, concept);

  assertEqual(measured.type, 'MEASURED');
  assertEqual(measured.value, 10);
  assertEqual(measured.unit, 'kg');
  assertEqual(measured.conceptName, 'Weight');
});

// ============== projectNumeric ==============

category('projectNumeric - Numeric Extraction');

test('projectNumeric extracts from MEASURED', {
  input: 'projectNumeric(measured, "mass")',
  expected: '{type: "NUMERIC", value: 42}',
  spec: 'FS-05'
}, () => {
  const measured = {
    type: 'MEASURED',
    value: 42,
    unit: 'kg',
    conceptName: 'Ball'
  };
  const result = projectNumeric(measured, 'mass');

  assertEqual(result.type, 'NUMERIC');
  assertEqual(result.value, 42);
  assertEqual(result.unit, 'kg');
});

test('projectNumeric passes through NUMERIC', {
  input: 'projectNumeric(numeric, "mass")',
  expected: '{type: "NUMERIC"}',
  spec: 'FS-05'
}, () => {
  const numeric = makeNumeric(10);
  const result = projectNumeric(numeric, 'mass');

  assertEqual(result.type, 'NUMERIC');
  assertEqual(result.value, 10);
});

test('projectNumeric from VECTOR with properties', {
  input: 'projectNumeric(vector, "mass")',
  expected: '{type: "NUMERIC"}',
  spec: 'FS-05'
}, () => {
  const vector = {
    type: 'VECTOR',
    value: new Float32Array([1, 2, 3]),
    name: 'Ball',
    properties: {
      mass: { value: 5, unit: 'kg' }
    }
  };
  const result = projectNumeric(vector, 'mass');

  assertEqual(result.type, 'NUMERIC');
  assertEqual(result.value, 5);
  assertEqual(result.unit, 'kg');
});

test('projectNumeric from VECTOR without property returns zero', {
  input: 'projectNumeric(vector, "unknown")',
  expected: '{type: "NUMERIC", value: 0}',
  spec: 'FS-05'
}, () => {
  const vector = {
    type: 'VECTOR',
    value: new Float32Array([1, 2, 3]),
    name: 'Ball'
  };
  const result = projectNumeric(vector, 'unknown');

  assertEqual(result.type, 'NUMERIC');
  assertEqual(result.value, 0);
  assert(result.warning, 'Should have warning about missing property');
});

// ============== Exit ==============

exit();
