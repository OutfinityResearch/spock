/**
 * @fileoverview Numeric runtime values and operations with units
 * @implements URS-003, FS-05, DS Numeric
 */

'use strict';

/**
 * Unit composition rules for multiplication
 * @type {Object.<string, Object.<string, string>>}
 */
const UNIT_MULTIPLY = {
  'm': { 'm': 'm2', 's': 'm_s' },
  'kg': { 'm_per_s2': 'N' },
  'N': { 'm': 'J' },
  's': { 's': 's2' }
};

/**
 * Unit composition rules for division
 * @type {Object.<string, Object.<string, string>>}
 */
const UNIT_DIVIDE = {
  'm': { 's': 'm_per_s' },
  'm2': { 's': 'm2_per_s' },
  'J': { 's': 'W' },
  'm_per_s': { 's': 'm_per_s2' }
};

/**
 * Creates a NumericValue from a raw number
 * DSL Mapping: HasNumericValue verb
 *
 * @param {number} value - Raw numeric value
 * @returns {{type: string, value: number, unit: null}}
 */
function makeNumeric(value) {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return {
    type: 'NUMERIC',
    value: value,
    unit: null
  };
}

/**
 * Attaches a unit to a numeric value
 * DSL Mapping: AttachUnit verb
 *
 * @param {Object} numeric - NumericValue without unit
 * @param {string} unitSymbol - Unit symbol (e.g., 'kg', 'm', 's')
 * @returns {Object} NumericValue with unit
 */
function attachUnit(numeric, unitSymbol) {
  if (numeric.type !== 'NUMERIC') {
    throw new Error(`Expected NUMERIC type, got ${numeric.type}`);
  }
  if (typeof unitSymbol !== 'string') {
    throw new Error(`Unit must be a string, got ${typeof unitSymbol}`);
  }
  return {
    type: 'NUMERIC',
    value: numeric.value,
    unit: unitSymbol
  };
}

/**
 * Checks if two units are compatible for addition/subtraction
 * @param {string|null} unitA - First unit
 * @param {string|null} unitB - Second unit
 * @returns {boolean} True if compatible
 */
function unitsCompatible(unitA, unitB) {
  if (unitA === null || unitB === null) return true;
  return unitA === unitB;
}

/**
 * Composes units for multiplication
 * @param {string|null} unitA - First unit
 * @param {string|null} unitB - Second unit
 * @returns {string|null} Resulting unit
 */
function composeMultiply(unitA, unitB) {
  if (unitA === null) return unitB;
  if (unitB === null) return unitA;

  // Check composition rules
  if (UNIT_MULTIPLY[unitA] && UNIT_MULTIPLY[unitA][unitB]) {
    return UNIT_MULTIPLY[unitA][unitB];
  }
  if (UNIT_MULTIPLY[unitB] && UNIT_MULTIPLY[unitB][unitA]) {
    return UNIT_MULTIPLY[unitB][unitA];
  }

  // Default: concatenate
  return `${unitA}_${unitB}`;
}

/**
 * Composes units for division
 * @param {string|null} unitA - Numerator unit
 * @param {string|null} unitB - Denominator unit
 * @returns {string|null} Resulting unit
 */
function composeDivide(unitA, unitB) {
  if (unitB === null) return unitA;
  if (unitA === null) return `1_per_${unitB}`;

  // Check composition rules
  if (UNIT_DIVIDE[unitA] && UNIT_DIVIDE[unitA][unitB]) {
    return UNIT_DIVIDE[unitA][unitB];
  }

  // Check if units cancel
  if (unitA === unitB) return null;

  // Default: use _per_ notation
  return `${unitA}_per_${unitB}`;
}

/**
 * Adds two numeric values
 * DSL Mapping: AddNumeric verb
 *
 * @param {Object} a - First NumericValue
 * @param {Object} b - Second NumericValue
 * @returns {Object} Sum NumericValue
 * @throws {Error} If units incompatible
 */
function addNumeric(a, b) {
  if (a.type !== 'NUMERIC' || b.type !== 'NUMERIC') {
    throw new Error('AddNumeric requires NUMERIC operands');
  }
  if (!unitsCompatible(a.unit, b.unit)) {
    throw new Error(`Incompatible units: ${a.unit} and ${b.unit}`);
  }
  return {
    type: 'NUMERIC',
    value: a.value + b.value,
    unit: a.unit || b.unit
  };
}

/**
 * Subtracts two numeric values
 * DSL Mapping: SubNumeric verb
 *
 * @param {Object} a - First NumericValue
 * @param {Object} b - Second NumericValue
 * @returns {Object} Difference NumericValue
 * @throws {Error} If units incompatible
 */
function subNumeric(a, b) {
  if (a.type !== 'NUMERIC' || b.type !== 'NUMERIC') {
    throw new Error('SubNumeric requires NUMERIC operands');
  }
  if (!unitsCompatible(a.unit, b.unit)) {
    throw new Error(`Incompatible units: ${a.unit} and ${b.unit}`);
  }
  return {
    type: 'NUMERIC',
    value: a.value - b.value,
    unit: a.unit || b.unit
  };
}

/**
 * Multiplies two numeric values
 * DSL Mapping: MulNumeric verb
 *
 * @param {Object} a - First NumericValue
 * @param {Object} b - Second NumericValue
 * @returns {Object} Product NumericValue
 */
function mulNumeric(a, b) {
  if (a.type !== 'NUMERIC' || b.type !== 'NUMERIC') {
    throw new Error('MulNumeric requires NUMERIC operands');
  }
  return {
    type: 'NUMERIC',
    value: a.value * b.value,
    unit: composeMultiply(a.unit, b.unit)
  };
}

/**
 * Divides two numeric values
 * DSL Mapping: DivNumeric verb
 *
 * @param {Object} a - Dividend NumericValue
 * @param {Object} b - Divisor NumericValue
 * @returns {Object} Quotient NumericValue
 * @throws {Error} If division by zero
 */
function divNumeric(a, b) {
  if (a.type !== 'NUMERIC' || b.type !== 'NUMERIC') {
    throw new Error('DivNumeric requires NUMERIC operands');
  }
  if (b.value === 0) {
    throw new Error('Division by zero');
  }
  return {
    type: 'NUMERIC',
    value: a.value / b.value,
    unit: composeDivide(a.unit, b.unit)
  };
}

/**
 * Attaches a numeric value to a concept
 * DSL Mapping: AttachToConcept verb
 *
 * @param {Object} numeric - NumericValue
 * @param {Object} concept - Concept (VECTOR type)
 * @returns {Object} MeasuredValue with concept link
 */
function attachToConcept(numeric, concept) {
  if (numeric.type !== 'NUMERIC') {
    throw new Error('AttachToConcept requires NUMERIC first operand');
  }
  return {
    type: 'MEASURED',
    value: numeric.value,
    unit: numeric.unit,
    concept: concept
  };
}

/**
 * Projects/extracts numeric value from a concept
 * DSL Mapping: ProjectNumeric verb
 *
 * @param {Object} concept - Concept with measured values
 * @param {string} property - Property name to extract
 * @returns {Object} NumericValue
 */
function projectNumeric(concept, property) {
  // This is a placeholder - actual implementation depends on
  // how concepts store associated numeric properties
  return {
    type: 'NUMERIC',
    value: 0,
    unit: null
  };
}

/**
 * Numeric verb registry
 */
const NUMERIC_VERBS = {
  'HasNumericValue': (subject, object) => makeNumeric(parseFloat(subject)),
  'AttachUnit': attachUnit,
  'AddNumeric': addNumeric,
  'SubNumeric': subNumeric,
  'MulNumeric': mulNumeric,
  'DivNumeric': divNumeric,
  'AttachToConcept': attachToConcept,
  'ProjectNumeric': projectNumeric
};

/**
 * Checks if a verb is a numeric verb
 * @param {string} verbName - Verb name
 * @returns {boolean} True if numeric verb
 */
function isNumericVerb(verbName) {
  return verbName in NUMERIC_VERBS;
}

/**
 * Gets a numeric verb implementation
 * @param {string} verbName - Verb name
 * @returns {function|null} Verb function or null
 */
function getNumericVerb(verbName) {
  return NUMERIC_VERBS[verbName] || null;
}

module.exports = {
  makeNumeric,
  attachUnit,
  addNumeric,
  subNumeric,
  mulNumeric,
  divNumeric,
  attachToConcept,
  projectNumeric,
  isNumericVerb,
  getNumericVerb,
  NUMERIC_VERBS
};
