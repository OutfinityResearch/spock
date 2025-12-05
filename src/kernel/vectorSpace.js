/**
 * @fileoverview Hypervector storage and basic vector math helpers
 * @implements URS-003, URS-006, FS-01, DS Kernel
 */

'use strict';

const { getConfig, getTypedArrayConstructor } = require('../config/config');

/**
 * Seeded random number generator (Mulberry32)
 * @param {number} seed - Initial seed
 * @returns {function(): number} Random function returning [0, 1)
 */
function createSeededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform for Gaussian random numbers
 * @param {function(): number} rand - Uniform random function
 * @returns {number} Gaussian random number (mean=0, std=1)
 */
function gaussianRandom(rand) {
  const u1 = rand();
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Current random function (can be seeded or Math.random)
 * @type {function(): number}
 */
let randomFn = Math.random;

/**
 * Sets the random seed for reproducible vector generation
 * @param {number|null} seed - Seed value or null for system random
 */
function setRandomSeed(seed) {
  if (seed === null) {
    randomFn = Math.random;
  } else {
    randomFn = createSeededRandom(seed);
  }
}

/**
 * Creates a new zero-initialized hypervector
 * @param {number} [dim] - Dimensionality (defaults to config)
 * @returns {Float32Array|Float64Array} Zero vector
 */
function createVector(dim) {
  const config = getConfig();
  const d = dim || config.dimensions;
  const TypedArray = getTypedArrayConstructor();
  return new TypedArray(d);
}

/**
 * Creates a new hypervector with random components
 * @param {number} [dim] - Dimensionality (defaults to config)
 * @returns {Float32Array|Float64Array} Random vector
 */
function createRandomVector(dim) {
  const config = getConfig();
  const d = dim || config.dimensions;
  const TypedArray = getTypedArrayConstructor();
  const vec = new TypedArray(d);

  if (config.vectorGeneration === 'bipolar') {
    // Bipolar: +1 or -1
    for (let i = 0; i < d; i++) {
      vec[i] = randomFn() < 0.5 ? -1 : 1;
    }
  } else {
    // Gaussian: N(0, 1/sqrt(d)) for expected unit norm
    const scale = 1 / Math.sqrt(d);
    for (let i = 0; i < d; i++) {
      vec[i] = gaussianRandom(randomFn) * scale;
    }
  }

  return vec;
}

/**
 * Creates a deep copy of a vector
 * @param {Float32Array|Float64Array} vec - Source vector
 * @returns {Float32Array|Float64Array} New vector with identical values
 */
function cloneVector(vec) {
  const TypedArray = vec.constructor;
  const result = new TypedArray(vec.length);
  result.set(vec);
  return result;
}

/**
 * Computes the dot product of two vectors
 * @param {Float32Array|Float64Array} a - First vector
 * @param {Float32Array|Float64Array} b - Second vector
 * @returns {number} Scalar dot product
 * @throws {Error} If dimensions don't match
 */
function dot(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Computes the L2 (Euclidean) norm of a vector
 * @param {Float32Array|Float64Array} vec - Input vector
 * @returns {number} L2 norm
 */
function norm(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes a vector to unit length
 * @param {Float32Array|Float64Array} vec - Input vector
 * @returns {Float32Array|Float64Array} Unit vector (new array)
 */
function normalise(vec) {
  const TypedArray = vec.constructor;
  const result = new TypedArray(vec.length);
  const n = norm(vec);

  if (n === 0) {
    // Return zero vector if input is zero
    return result;
  }

  const invNorm = 1 / n;
  for (let i = 0; i < vec.length; i++) {
    result[i] = vec[i] * invNorm;
  }
  return result;
}

/**
 * Computes cosine similarity between two vectors
 * @param {Float32Array|Float64Array} a - First vector
 * @param {Float32Array|Float64Array} b - Second vector
 * @returns {number} Cosine similarity in [-1, 1]
 */
function cosineSimilarity(a, b) {
  const dotProduct = dot(a, b);
  const normA = norm(a);
  const normB = norm(b);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Scales a vector by a scalar (creates new vector)
 * @param {Float32Array|Float64Array} vec - Input vector
 * @param {number} scalar - Scale factor
 * @returns {Float32Array|Float64Array} Scaled vector
 */
function scale(vec, scalar) {
  const TypedArray = vec.constructor;
  const result = new TypedArray(vec.length);
  for (let i = 0; i < vec.length; i++) {
    result[i] = vec[i] * scalar;
  }
  return result;
}

/**
 * Element-wise addition of two vectors
 * @param {Float32Array|Float64Array} a - First vector
 * @param {Float32Array|Float64Array} b - Second vector
 * @returns {Float32Array|Float64Array} Sum vector
 * @throws {Error} If dimensions don't match
 */
function addVectors(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
  }

  const TypedArray = a.constructor;
  const result = new TypedArray(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] + b[i];
  }
  return result;
}

/**
 * Element-wise multiplication (Hadamard product)
 * @param {Float32Array|Float64Array} a - First vector
 * @param {Float32Array|Float64Array} b - Second vector
 * @returns {Float32Array|Float64Array} Product vector
 * @throws {Error} If dimensions don't match
 */
function hadamard(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
  }

  const TypedArray = a.constructor;
  const result = new TypedArray(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] * b[i];
  }
  return result;
}

module.exports = {
  createVector,
  createRandomVector,
  cloneVector,
  dot,
  norm,
  normalise,
  cosineSimilarity,
  scale,
  addVectors,
  hadamard,
  setRandomSeed
};
