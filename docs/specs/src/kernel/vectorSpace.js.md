# DS src/kernel/vectorSpace.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Manage hypervector storage and basic vector math helpers. Hide TypedArray details from the rest of the system. |
| **Public functions** | `createVector(dim)`, `createRandomVector(dim)`, `cloneVector(vec)`, `dot(a, b)`, `norm(vec)`, `normalise(vec)`, `cosineSimilarity(a, b)`, `scale(vec, scalar)`, `addVectors(a, b)`, `hadamard(a, b)`, `setRandomSeed(seed)` |
| **Depends on** | `src/config/config.js`, Standard JavaScript / Node.js APIs (Float32Array and related). |
| **Used by** | `src/kernel/primitiveOps.js`, `src/planning/planner.js`, `src/dsl/executor.js`, `src/api/engineFactory.js`, `src/viz/projectionService.js` |

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

### `createRandomVector(dim)`

Creates a new hypervector with random components, suitable for use as a concept prototype or canonical constant.

**Parameters:**
- `dim` (number): The dimensionality of the vector

**Returns:**
- Float32Array of length `dim`, with random values

**Generation Methods (configurable):**
- **Gaussian**: Each component sampled from N(0, 1/√dim) - produces dense vectors
- **Bipolar**: Each component is +1 or -1 with equal probability - standard in VSA

**Constraints:**
- `dim` must be a positive integer
- Results should be reproducible given a seed (for testing)
- Default: Gaussian distribution, can be configured in `config.js`

**Usage:**
```javascript
// For canonical Truth constant (then normalise)
const truth = normalise(createRandomVector(512));

// For new concept prototypes
const catConcept = createRandomVector(512);
```

**Design Rationale:** Random dense vectors in high-dimensional spaces are quasi-orthogonal with high probability. This property is fundamental to Vector Symbolic Architectures (VSA) and enables robust concept separation without explicit orthogonalization.

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

### `cosineSimilarity(a, b)`

Computes the cosine similarity between two vectors.

**Parameters:**
- `a` (Float32Array): First vector
- `b` (Float32Array): Second vector

**Returns:**
- number: Cosine similarity in [-1, 1]

**Constraints:**
- Both vectors must have the same dimension
- Returns 0 if either vector is zero
- Symmetric: cosineSimilarity(a, b) = cosineSimilarity(b, a)

### `scale(vec, scalar)`

Scales a vector by a scalar factor.

**Parameters:**
- `vec` (Float32Array): Input vector
- `scalar` (number): Scale factor

**Returns:**
- Float32Array: Scaled vector (new array)

**Constraints:**
- Does not modify input vector
- scale(v, 0) returns zero vector
- scale(v, 1) returns copy of v

### `addVectors(a, b)`

Element-wise addition of two vectors.

**Parameters:**
- `a` (Float32Array): First vector
- `b` (Float32Array): Second vector

**Returns:**
- Float32Array: Sum vector

**Constraints:**
- Both vectors must have the same dimension
- Commutative: addVectors(a, b) = addVectors(b, a)

### `hadamard(a, b)`

Element-wise multiplication (Hadamard product) of two vectors.

**Parameters:**
- `a` (Float32Array): First vector
- `b` (Float32Array): Second vector

**Returns:**
- Float32Array: Element-wise product

**Constraints:**
- Both vectors must have the same dimension
- Commutative: hadamard(a, b) = hadamard(b, a)
- Used for binding operations in VSA

### `setRandomSeed(seed)`

Sets the random seed for reproducible vector generation.

**Parameters:**
- `seed` (number|null): Seed value, or null for system random

**Returns:**
- void

**Usage:**
```javascript
setRandomSeed(42);  // Deterministic for testing
setRandomSeed(null); // Use Math.random
```

**Constraints:**
- Affects all subsequent createRandomVector calls
- Uses Mulberry32 PRNG for seeded generation
