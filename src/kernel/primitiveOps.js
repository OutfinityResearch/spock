/**
 * @fileoverview Geometric primitive verbs as pure vector operations
 * @implements URS-003, FS-02, FS-03, DS Kernel
 *
 * These are the 8 core kernel verbs that form the geometric basis:
 * - Add: Superposition (blend concepts)
 * - Bind: Association (Hadamard product for role-filler binding)
 * - Negate: Logical negation (flip vector)
 * - Distance: Similarity measurement (cosine similarity)
 * - Move: State transition (alias for Add)
 * - Modulate: Scaling/gating (polymorphic: scalar or vector)
 * - Identity: Pass-through (copy)
 * - Normalise: Unit vector projection
 */

'use strict';

const vectorSpace = require('./vectorSpace');
const debug = require('../logging/debugLogger').kernel;

/**
 * Element-wise addition of two vectors
 * DSL Mapping: Add verb
 *
 * @param {Float32Array|Float64Array} a - First vector
 * @param {Float32Array|Float64Array} b - Second vector
 * @returns {Float32Array|Float64Array} Sum vector
 */
function add(a, b) {
  debug.enter('primitiveOps', 'Add', { subject: a, object: b });
  debug.step('primitiveOps', 'DSL: @result subject Add object');

  const result = vectorSpace.addVectors(a, b);

  debug.step('primitiveOps', `Superposition of two ${a.length}D vectors`);
  debug.exit('primitiveOps', 'Add', result);
  return result;
}

/**
 * Binding operation (element-wise product / Hadamard)
 * Creates compositional representations for role-filler binding
 * DSL Mapping: Bind verb
 *
 * @param {Float32Array|Float64Array} a - First vector
 * @param {Float32Array|Float64Array} b - Second vector
 * @returns {Float32Array|Float64Array} Bound vector
 */
function bind(a, b) {
  debug.enter('primitiveOps', 'Bind', { subject: a, object: b });
  debug.step('primitiveOps', 'DSL: @result subject Bind object');

  const result = vectorSpace.hadamard(a, b);

  debug.step('primitiveOps', `Associative binding via Hadamard product`);
  debug.exit('primitiveOps', 'Bind', result);
  return result;
}


/**
 * Element-wise negation
 * DSL Mapping: Negate verb
 *
 * @param {Float32Array|Float64Array} v - Input vector
 * @returns {Float32Array|Float64Array} Negated vector
 */
function negate(v) {
  debug.enter('primitiveOps', 'Negate', { subject: v });
  debug.step('primitiveOps', 'DSL: @result subject Negate _');

  const result = vectorSpace.scale(v, -1);

  debug.step('primitiveOps', `Logical negation: v → -v`);
  debug.exit('primitiveOps', 'Negate', result);
  return result;
}

/**
 * Computes similarity/distance between two vectors
 * Returns cosine similarity as a scalar in [0, 1] (mapped from [-1, 1])
 * DSL Mapping: Distance verb
 *
 * @param {Float32Array|Float64Array} a - First vector
 * @param {Float32Array|Float64Array} b - Second vector
 * @returns {number} Similarity score in [0, 1]
 */
function distance(a, b) {
  debug.enter('primitiveOps', 'Distance', { subject: a, object: b });
  debug.step('primitiveOps', 'DSL: @result subject Distance object');

  // Cosine similarity is in [-1, 1], map to [0, 1]
  const cosSim = vectorSpace.cosineSimilarity(a, b);
  const result = (cosSim + 1) / 2;

  debug.step('primitiveOps', `Cosine similarity: ${cosSim.toFixed(6)} → normalized: ${result.toFixed(6)}`);
  debug.exit('primitiveOps', 'Distance', result);
  return result;
}

/**
 * Translates a state vector by a delta
 * Equivalent to add but semantically represents movement in space
 * DSL Mapping: Move verb
 *
 * @param {Float32Array|Float64Array} state - Current state vector
 * @param {Float32Array|Float64Array} delta - Movement vector
 * @returns {Float32Array|Float64Array} New state
 */
function move(state, delta) {
  debug.enter('primitiveOps', 'Move', { subject: state, object: delta });
  debug.step('primitiveOps', 'DSL: @result subject Move object');

  const result = vectorSpace.addVectors(state, delta);

  debug.step('primitiveOps', `State transition: state + delta → new_state`);
  debug.exit('primitiveOps', 'Move', result);
  return result;
}

/**
 * Polymorphic modulation: scales by vector (gating) or scalar (scaling)
 * DSL Mapping: Modulate verb
 *
 * @param {Float32Array|Float64Array} v - Input vector
 * @param {Float32Array|Float64Array|number} operand - Gate vector or scalar
 * @returns {Float32Array|Float64Array} Modulated vector
 */
function modulate(v, operand) {
  debug.enter('primitiveOps', 'Modulate', { subject: v, object: operand });
  debug.step('primitiveOps', 'DSL: @result subject Modulate object');

  let result;
  if (typeof operand === 'number') {
    // Scalar mode: scale the vector
    debug.step('primitiveOps', `Scalar modulation: v × ${operand}`);
    result = vectorSpace.scale(v, operand);
  } else {
    // Vector mode: Hadamard product (gating)
    debug.step('primitiveOps', `Vector gating: v ⊙ gate`);
    result = vectorSpace.hadamard(v, operand);
  }

  debug.exit('primitiveOps', 'Modulate', result);
  return result;
}

/**
 * Identity operation - returns a copy of the input
 * Used when DSL syntax requires a verb but no transformation is needed
 * DSL Mapping: Identity verb
 *
 * @param {Float32Array|Float64Array} v - Input vector
 * @returns {Float32Array|Float64Array} Copy of input
 */
function identity(v) {
  debug.enter('primitiveOps', 'Identity', { subject: v });
  debug.step('primitiveOps', 'DSL: @result subject Identity _');

  const result = vectorSpace.cloneVector(v);

  debug.step('primitiveOps', `Pass-through (deep copy)`);
  debug.exit('primitiveOps', 'Identity', result);
  return result;
}

/**
 * Normalizes vector to unit length
 * DSL Mapping: Normalise verb
 *
 * @param {Float32Array|Float64Array} v - Input vector
 * @returns {Float32Array|Float64Array} Unit vector
 */
function normalise(v) {
  debug.enter('primitiveOps', 'Normalise', { subject: v });
  debug.step('primitiveOps', 'DSL: @result subject Normalise _');

  const result = vectorSpace.normalise(v);

  debug.step('primitiveOps', `Unit vector projection: ||v|| → 1`);
  debug.exit('primitiveOps', 'Normalise', result);
  return result;
}

/**
 * Kernel verb registry - maps verb names to implementations
 * Note: 'Is' is NOT a kernel verb - it's defined in BaseLogic theory as Bind+Move
 */
const KERNEL_VERBS = {
  'Add': add,
  'Bind': bind,
  'Negate': negate,
  'Distance': distance,
  'Move': move,
  'Modulate': modulate,
  'Identity': identity,
  'Normalise': normalise
};

/**
 * Checks if a verb name is a kernel verb
 * @param {string} verbName - Name of the verb
 * @returns {boolean} True if kernel verb
 */
function isKernelVerb(verbName) {
  return verbName in KERNEL_VERBS;
}

/**
 * Gets the kernel verb implementation
 * @param {string} verbName - Name of the verb
 * @returns {function|null} Verb function or null
 */
function getKernelVerb(verbName) {
  return KERNEL_VERBS[verbName] || null;
}

/**
 * Executes a kernel verb
 * @param {string} verbName - Name of the verb
 * @param {*} subject - Subject value
 * @param {*} object - Object value
 * @returns {*} Result of verb execution
 * @throws {Error} If verb not found
 */
function executeKernelVerb(verbName, subject, object) {
  debug.enter('primitiveOps', 'executeKernelVerb', { verbName, subject, object });

  const verbFn = KERNEL_VERBS[verbName];
  if (!verbFn) {
    debug.warn('primitiveOps', `Unknown kernel verb: ${verbName}`);
    throw new Error(`Unknown kernel verb: ${verbName}`);
  }

  debug.step('primitiveOps', `Dispatching to ${verbName}`);
  const result = verbFn(subject, object);

  debug.exit('primitiveOps', 'executeKernelVerb', result);
  return result;
}

module.exports = {
  add,
  bind,
  negate,
  distance,
  move,
  modulate,
  identity,
  normalise,
  isKernelVerb,
  getKernelVerb,
  executeKernelVerb,
  KERNEL_VERBS
};
