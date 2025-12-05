/**
 * @fileoverview Projection service for high-dimensional vectors to 2D/3D
 * @implements DS Visualisation
 */

'use strict';

const vectorSpace = require('../kernel/vectorSpace');

/**
 * Projects vectors to 2D using simple linear projection (first 2 dimensions)
 * @param {Array<{id: string, vec: Float32Array}>} vectors - Input vectors
 * @returns {Array<{id: string, x: number, y: number}>} Projected points
 */
function linear2d(vectors) {
  return vectors.map(({ id, vec }) => ({
    id,
    x: vec.length > 0 ? vec[0] : 0,
    y: vec.length > 1 ? vec[1] : 0
  }));
}

/**
 * Projects vectors to 3D using simple linear projection (first 3 dimensions)
 * @param {Array<{id: string, vec: Float32Array}>} vectors - Input vectors
 * @returns {Array<{id: string, x: number, y: number, z: number}>} Projected points
 */
function linear3d(vectors) {
  return vectors.map(({ id, vec }) => ({
    id,
    x: vec.length > 0 ? vec[0] : 0,
    y: vec.length > 1 ? vec[1] : 0,
    z: vec.length > 2 ? vec[2] : 0
  }));
}

/**
 * Computes mean vector
 * @param {Array<Float32Array>} vectors - Input vectors
 * @returns {Float32Array} Mean vector
 */
function computeMean(vectors) {
  if (vectors.length === 0) return new Float32Array(0);

  const dim = vectors[0].length;
  const mean = new Float32Array(dim);

  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      mean[i] += vec[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    mean[i] /= vectors.length;
  }

  return mean;
}

/**
 * Centers vectors by subtracting mean
 * @param {Array<Float32Array>} vectors - Input vectors
 * @param {Float32Array} mean - Mean vector
 * @returns {Array<Float32Array>} Centered vectors
 */
function centerVectors(vectors, mean) {
  return vectors.map(vec => {
    const centered = new Float32Array(vec.length);
    for (let i = 0; i < vec.length; i++) {
      centered[i] = vec[i] - mean[i];
    }
    return centered;
  });
}

/**
 * Computes covariance matrix (simplified for top components)
 * Uses power iteration to find principal components
 * @param {Array<Float32Array>} centered - Centered vectors
 * @param {number} numComponents - Number of components to extract
 * @returns {Array<Float32Array>} Principal components
 */
function computePrincipalComponents(centered, numComponents) {
  if (centered.length === 0) return [];

  const dim = centered[0].length;
  const components = [];

  // Power iteration for each component
  for (let comp = 0; comp < numComponents; comp++) {
    // Random starting vector
    let eigenvector = vectorSpace.createRandomVector(dim);
    eigenvector = vectorSpace.normalise(eigenvector);

    // Power iteration (20 iterations usually sufficient)
    for (let iter = 0; iter < 20; iter++) {
      // Compute A^T * A * v (covariance matrix * v)
      const newVec = new Float32Array(dim);

      for (const vec of centered) {
        // Project vec onto current eigenvector
        const proj = vectorSpace.dot(vec, eigenvector);
        // Accumulate outer product contribution
        for (let i = 0; i < dim; i++) {
          newVec[i] += proj * vec[i];
        }
      }

      // Subtract projections onto previous components (deflation)
      for (const prevComp of components) {
        const proj = vectorSpace.dot(newVec, prevComp);
        for (let i = 0; i < dim; i++) {
          newVec[i] -= proj * prevComp[i];
        }
      }

      eigenvector = vectorSpace.normalise(newVec);
    }

    components.push(eigenvector);
  }

  return components;
}

/**
 * Projects vectors to 2D using PCA
 * @param {Array<{id: string, vec: Float32Array}>} vectors - Input vectors
 * @returns {Array<{id: string, x: number, y: number}>} Projected points
 */
function pca2d(vectors) {
  if (vectors.length === 0) return [];
  if (vectors.length === 1) {
    return [{ id: vectors[0].id, x: 0, y: 0 }];
  }

  const vecs = vectors.map(v => v.vec);
  const mean = computeMean(vecs);
  const centered = centerVectors(vecs, mean);
  const components = computePrincipalComponents(centered, 2);

  if (components.length < 2) {
    return linear2d(vectors);
  }

  // Project onto principal components
  const points = vectors.map(({ id, vec }, idx) => {
    const centeredVec = centered[idx];
    return {
      id,
      x: vectorSpace.dot(centeredVec, components[0]),
      y: vectorSpace.dot(centeredVec, components[1])
    };
  });

  // Normalize to [-1, 1] range
  return normalizePoints2d(points);
}

/**
 * Projects vectors to 3D using PCA
 * @param {Array<{id: string, vec: Float32Array}>} vectors - Input vectors
 * @returns {Array<{id: string, x: number, y: number, z: number}>} Projected points
 */
function pca3d(vectors) {
  if (vectors.length === 0) return [];
  if (vectors.length === 1) {
    return [{ id: vectors[0].id, x: 0, y: 0, z: 0 }];
  }

  const vecs = vectors.map(v => v.vec);
  const mean = computeMean(vecs);
  const centered = centerVectors(vecs, mean);
  const components = computePrincipalComponents(centered, 3);

  if (components.length < 3) {
    return linear3d(vectors);
  }

  // Project onto principal components
  const points = vectors.map(({ id, vec }, idx) => {
    const centeredVec = centered[idx];
    return {
      id,
      x: vectorSpace.dot(centeredVec, components[0]),
      y: vectorSpace.dot(centeredVec, components[1]),
      z: vectorSpace.dot(centeredVec, components[2])
    };
  });

  // Normalize to [-1, 1] range
  return normalizePoints3d(points);
}

/**
 * Normalizes 2D points to [-1, 1] range
 * @param {Array<{id: string, x: number, y: number}>} points - Input points
 * @returns {Array<{id: string, x: number, y: number}>} Normalized points
 */
function normalizePoints2d(points) {
  if (points.length === 0) return [];

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return points.map(({ id, x, y }) => ({
    id,
    x: 2 * (x - minX) / rangeX - 1,
    y: 2 * (y - minY) / rangeY - 1
  }));
}

/**
 * Normalizes 3D points to [-1, 1] range
 * @param {Array<{id: string, x: number, y: number, z: number}>} points - Input points
 * @returns {Array<{id: string, x: number, y: number, z: number}>} Normalized points
 */
function normalizePoints3d(points) {
  if (points.length === 0) return [];

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const rangeZ = maxZ - minZ || 1;

  return points.map(({ id, x, y, z }) => ({
    id,
    x: 2 * (x - minX) / rangeX - 1,
    y: 2 * (y - minY) / rangeY - 1,
    z: 2 * (z - minZ) / rangeZ - 1
  }));
}

/**
 * Projection methods registry
 */
const PROJECTION_METHODS = {
  'pca2d': pca2d,
  'pca3d': pca3d,
  'linear2d': linear2d,
  'linear3d': linear3d
};

/**
 * Projects an array of high-dimensional vectors to 2D or 3D
 * @param {Array<{id: string, vec: Float32Array}>} vectors - Input vectors
 * @param {string} [method='pca2d'] - Projection method
 * @returns {Array<{id: string, x: number, y: number, z?: number}>} Projected points
 */
function projectVectors(vectors, method = 'pca2d') {
  if (!vectors || vectors.length === 0) {
    return [];
  }

  const projector = PROJECTION_METHODS[method];
  if (!projector) {
    throw new Error(`Unknown projection method: ${method}. Available: ${Object.keys(PROJECTION_METHODS).join(', ')}`);
  }

  return projector(vectors);
}

/**
 * Gets available projection methods
 * @returns {string[]} Method names
 */
function getAvailableMethods() {
  return Object.keys(PROJECTION_METHODS);
}

module.exports = {
  projectVectors,
  getAvailableMethods,
  pca2d,
  pca3d,
  linear2d,
  linear3d,
  // Internal helpers exposed for testing
  computeMean,
  centerVectors,
  computePrincipalComponents,
  normalizePoints2d,
  normalizePoints3d
};
