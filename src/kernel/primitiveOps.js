/**
 * @fileoverview Geometric primitive verbs as pure vector operations
 * @implements URS-003, FS-02, FS-03, DS Kernel
 */

'use strict';

const vectorSpace = require('./vectorSpace');

/**
 * Element-wise addition of two vectors
 * DSL Mapping: Add verb
 *
 * @param {Float32Array|Float64Array} a - First vector
 * @param {Float32Array|Float64Array} b - Second vector
 * @returns {Float32Array|Float64Array} Sum vector
 */
function add(a, b) {
  return vectorSpace.addVectors(a, b);
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
  return vectorSpace.hadamard(a, b);
}

/**
 * Element-wise negation
 * DSL Mapping: Negate verb
 *
 * @param {Float32Array|Float64Array} v - Input vector
 * @returns {Float32Array|Float64Array} Negated vector
 */
function negate(v) {
  return vectorSpace.scale(v, -1);
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
  // Cosine similarity is in [-1, 1], map to [0, 1]
  const cosSim = vectorSpace.cosineSimilarity(a, b);
  return (cosSim + 1) / 2;
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
  return vectorSpace.addVectors(state, delta);
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
  if (typeof operand === 'number') {
    // Scalar mode: scale the vector
    return vectorSpace.scale(v, operand);
  } else {
    // Vector mode: Hadamard product (gating)
    return vectorSpace.hadamard(v, operand);
  }
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
  return vectorSpace.cloneVector(v);
}

/**
 * Normalizes vector to unit length
 * DSL Mapping: Normalise verb
 *
 * @param {Float32Array|Float64Array} v - Input vector
 * @returns {Float32Array|Float64Array} Unit vector
 */
function normalise(v) {
  return vectorSpace.normalise(v);
}

/**
 * Kernel verb registry - maps verb names to implementations
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
  const verbFn = KERNEL_VERBS[verbName];
  if (!verbFn) {
    throw new Error(`Unknown kernel verb: ${verbName}`);
  }
  return verbFn(subject, object);
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
