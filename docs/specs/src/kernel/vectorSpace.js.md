# DS src/kernel/vectorSpace.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Manage hypervector storage and basic vector math helpers. Hide TypedArray details from the rest of the system. |
| **Public functions** | `createVector(dim)`, `cloneVector(vec)`, `dot(a, b)`, `norm(vec)`, `normalise(vec)` |
| **Depends on** | Standard JavaScript / Node.js APIs (Float32Array and related). |
| **Used by** | `src/kernel/primitiveOps.js`, `src/viz/projectionService.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-003 Geometric knowledge representation, URS-006 Implementation platform |
| **Implements FS** | FS-01 Core conceptual model |
| **Implements DS** | DS Kernel architecture |

## Function Specifications

### `createVector(dim)`

Creates a new zero-initialized hypervector of the specified dimension.

**Parameters:**
- `dim` (number): The dimensionality of the vector

**Returns:**
- Float32Array of length `dim`, initialized to zeros

**Constraints:**
- `dim` must be a positive integer
- Memory allocation must be deterministic

### `cloneVector(vec)`

Creates a deep copy of the input vector.

**Parameters:**
- `vec` (Float32Array): The source vector to clone

**Returns:**
- A new Float32Array with identical values

**Constraints:**
- Must perform deep copy (no shared references)
- Output dimension equals input dimension

### `dot(a, b)`

Computes the dot product of two vectors.

**Parameters:**
- `a` (Float32Array): First vector
- `b` (Float32Array): Second vector

**Returns:**
- number: The scalar dot product

**Constraints:**
- Both vectors must have the same dimension
- Must be numerically stable for large dimensions

### `norm(vec)`

Computes the L2 (Euclidean) norm of a vector.

**Parameters:**
- `vec` (Float32Array): Input vector

**Returns:**
- number: The L2 norm

**Constraints:**
- Returns 0 for zero vectors
- Must handle very small/large values without overflow

### `normalise(vec)`

Normalizes a vector to unit length (in-place or returns new vector based on implementation).

**Parameters:**
- `vec` (Float32Array): Input vector

**Returns:**
- Float32Array: Unit vector in the same direction

**Constraints:**
- Returns zero vector if input is zero vector
- Norm of result should be ≈ 1.0 (within floating-point tolerance)
- Idempotent: normalise(normalise(v)) ≈ normalise(v)
