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
 * Attaches a numeric value to a concept vector
 * DSL Mapping: AttachToConcept verb
 *
 * Creates a MEASURED type that links a numeric value with its concept.
 * The concept reference allows tracing back to the semantic meaning.
 *
 * Example DSL: @mass 10kg AttachToConcept Ball
 * Result: { type: 'MEASURED', value: 10, unit: 'kg', concept: Ball, conceptName: 'Ball' }
 *
 * @param {Object} numeric - NumericValue (type: 'NUMERIC')
 * @param {Object} concept - Concept (type: 'VECTOR' or 'MEASURED' with vector)
 * @param {Object} [context] - Execution context (for name resolution)
 * @returns {Object} MeasuredValue with concept link
 */
function attachToConcept(numeric, concept, context = null) {
  if (numeric.type !== 'NUMERIC') {
    throw new Error(`AttachToConcept requires NUMERIC first operand, got ${numeric.type}`);
  }

  // Accept VECTOR directly or extract from MEASURED
  let conceptVector = null;
  let conceptName = null;

  if (concept.type === 'VECTOR') {
    conceptVector = concept.value;
    conceptName = concept.name || null;
  } else if (concept.type === 'MEASURED' && concept.conceptVector) {
    conceptVector = concept.conceptVector;
    conceptName = concept.conceptName || null;
  } else if (typeof concept === 'string') {
    // Concept passed as string name - store reference
    conceptName = concept;
    conceptVector = null;  // Will be resolved at query time
  } else {
    throw new Error(`AttachToConcept requires VECTOR or concept name as second operand, got ${concept.type || typeof concept}`);
  }

  return {
    type: 'MEASURED',
    value: numeric.value,
    unit: numeric.unit,
    conceptVector: conceptVector,
    conceptName: conceptName,
    // Preserve numeric origin for tracing
    numericSource: {
      value: numeric.value,
      unit: numeric.unit
    }
  };
}

/**
 * Projects/extracts numeric value from a measured concept
 * DSL Mapping: ProjectNumeric verb
 *
 * Extracts the numeric portion from a MEASURED value, or looks up
 * a numeric property associated with a concept.
 *
 * Example DSL: @mass Ball ProjectNumeric mass
 * - If Ball is MEASURED: returns the numeric value
 * - If Ball is VECTOR: looks for 'mass' property in context
 *
 * @param {Object} source - Source (MEASURED, VECTOR, or context object)
 * @param {Object|string} property - Property name or extraction hint
 * @param {Object} [context] - Execution context for property lookup
 * @returns {Object} NumericValue
 */
function projectNumeric(source, property, context = null) {
  // Case 1: Source is MEASURED - extract numeric directly
  if (source.type === 'MEASURED') {
    return {
      type: 'NUMERIC',
      value: source.value,
      unit: source.unit,
      projectedFrom: source.conceptName || 'measured'
    };
  }

  // Case 2: Source is NUMERIC - pass through
  if (source.type === 'NUMERIC') {
    return source;
  }

  // Case 3: Source is VECTOR - look up property in associated data
  if (source.type === 'VECTOR') {
    // Check if vector has associated numeric properties
    if (source.properties && typeof property === 'string') {
      const propValue = source.properties[property];
      if (propValue !== undefined) {
        return {
          type: 'NUMERIC',
          value: typeof propValue === 'number' ? propValue : propValue.value,
          unit: typeof propValue === 'object' ? propValue.unit : null,
          projectedFrom: property
        };
      }
    }

    // Check context for property associations
    if (context && context.session) {
      const propKey = `${source.name || '_'}:${property}`;
      const stored = context.session.localSymbols.get(propKey);
      if (stored && (stored.type === 'NUMERIC' || stored.type === 'MEASURED')) {
        return {
          type: 'NUMERIC',
          value: stored.value,
          unit: stored.unit,
          projectedFrom: propKey
        };
      }
    }

    // No numeric property found - return zero with warning
    return {
      type: 'NUMERIC',
      value: 0,
      unit: null,
      projectedFrom: null,
      warning: `No numeric property '${property}' found for concept`
    };
  }

  // Case 4: Property is NUMERIC - treat source as property name
  if (property && property.type === 'NUMERIC') {
    return property;
  }

  throw new Error(`ProjectNumeric: cannot extract numeric from ${source.type || typeof source}`);
}

/**
 * Numeric verb registry
 * Each verb receives (subject, object, context) and returns a typed value
 */
const NUMERIC_VERBS = {
  'HasNumericValue': (subject, object, context) => {
    // Subject is the raw value, object is ignored
    const rawValue = typeof subject === 'object' ? subject.value : subject;
    return makeNumeric(parseFloat(rawValue));
  },

  'AttachUnit': (subject, object, context) => {
    // Subject is NUMERIC, object is unit string
    const unitStr = typeof object === 'object' ? object.value : object;
    return attachUnit(subject, String(unitStr));
  },

  'AddNumeric': (subject, object, context) => addNumeric(subject, object),
  'SubNumeric': (subject, object, context) => subNumeric(subject, object),
  'MulNumeric': (subject, object, context) => mulNumeric(subject, object),
  'DivNumeric': (subject, object, context) => divNumeric(subject, object),

  'AttachToConcept': (subject, object, context) => attachToConcept(subject, object, context),
  'ProjectNumeric': (subject, object, context) => projectNumeric(subject, object, context)
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
