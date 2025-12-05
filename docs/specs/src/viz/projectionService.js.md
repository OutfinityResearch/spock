# DS src/viz/projectionService.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Project high-dimensional vectors to 2D or 3D coordinates for visualisation using configurable methods such as PCA or simple linear projections. |
| **Public functions** | `projectVectors(vectors, method)` where `vectors` is an array of `{id, vec}` and the result is an array of `{id, x, y, z?}`. |
| **Depends on** | `src/kernel/vectorSpace.js` (for basic numeric ops), optional small math utilities |
| **Used by** | `src/viz/vizApi.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-003 Geometric knowledge representation (visual view) |
| **Implements FS** | FS-01 Core conceptual model (space projection) |
| **Implements DS** | DS Visualisation and interaction |

## Input/Output Structures

### Input Vector

```javascript
{
  id: string,              // Unique identifier for the point
  vec: Float32Array        // High-dimensional vector
}
```

### Output Point

```javascript
{
  id: string,              // Same ID as input
  x: number,               // X coordinate
  y: number,               // Y coordinate
  z: number | undefined    // Z coordinate (for 3D)
}
```

## Function Specifications

### `projectVectors(vectors, method)`

Projects an array of high-dimensional vectors to 2D or 3D.

**Parameters:**
- `vectors` (VectorInput[]): Array of labeled vectors
- `method` (string): Projection method

**Returns:**
- Array of projected points

**Methods:**

| Method | Description |
|--------|-------------|
| `'pca2d'` | Principal Component Analysis to 2D |
| `'pca3d'` | Principal Component Analysis to 3D |
| `'linear2d'` | Simple linear projection using first 2 dims |
| `'linear3d'` | Simple linear projection using first 3 dims |
| `'umap2d'` | UMAP to 2D (if available) |

**Example:**
```javascript
const vectors = [
  { id: 'Socrates', vec: Float32Array([...]) },
  { id: 'Human', vec: Float32Array([...]) },
  { id: 'Mortal', vec: Float32Array([...]) }
];

const points = projectVectors(vectors, 'pca2d');
// [
//   { id: 'Socrates', x: 0.5, y: 0.3 },
//   { id: 'Human', x: 0.2, y: 0.8 },
//   { id: 'Mortal', x: 0.7, y: 0.6 }
// ]
```

## PCA Implementation Notes

1. Compute mean vector
2. Center all vectors
3. Compute covariance matrix
4. Find top 2 or 3 eigenvectors
5. Project centered vectors onto eigenvectors

## Constraints

- Deterministic: same input always produces same output
- Handles empty or single-element arrays gracefully
- Scales coordinates to reasonable range (e.g., [-1, 1])
