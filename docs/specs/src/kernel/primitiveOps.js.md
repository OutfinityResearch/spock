# DS src/kernel/primitiveOps.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Implement geometric primitive verbs that correspond to `Add`, `Bind`, `Negate`, `Distance`, `Move`, `Modulate`, `Identity`, `Normalise` as pure vector operations. |
| **Public functions** | `add(a, b)`, `bind(a, b)`, `negate(v)`, `distance(a, b)`, `move(state, delta)`, `modulate(v, operand)`, `identity(v)`, `normalise(v)` |
| **Depends on** | `src/kernel/vectorSpace.js` |
| **Used by** | `src/dsl/executor.js`, standard logic theories that map verb names to these functions |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-003 Geometric knowledge representation |
| **Implements FS** | FS-02 Verb taxonomy and constraints, FS-03 SpockDSL syntax and semantics |
| **Implements DS** | DS Kernel architecture |

## Function Specifications

### `add(a, b)`

Element-wise addition of two vectors.

**Parameters:**
- `a` (Float32Array): First vector
- `b` (Float32Array): Second vector

**Returns:**
- Float32Array: Result vector where `result[i] = a[i] + b[i]`

**DSL Mapping:** `Add` verb

**Constraints:**
- Commutative: `add(a, b) = add(b, a)`
- Associative: `add(add(a, b), c) = add(a, add(b, c))`
- Identity: `add(a, zero) = a`

### `bind(a, b)`

Binding operation (element-wise product or circular convolution).

**Parameters:**
- `a` (Float32Array): First vector
- `b` (Float32Array): Second vector

**Returns:**
- Float32Array: Bound vector

**DSL Mapping:** `Bind` verb

**Constraints:**
- Creates compositional representations
- Used for role-filler binding in concepts
- Implementation may use element-wise product or circular convolution

### `negate(v)`

Element-wise negation of a vector.

**Parameters:**
- `v` (Float32Array): Input vector

**Returns:**
- Float32Array: Negated vector where `result[i] = -v[i]`

**DSL Mapping:** `Negate` verb

**Constraints:**
- `negate(negate(v)) = v`
- `add(v, negate(v)) = zero`

### `distance(a, b)`

Computes the distance (or similarity) between two vectors.

**Parameters:**
- `a` (Float32Array): First vector
- `b` (Float32Array): Second vector

**Returns:**
- number: Distance or similarity score

**DSL Mapping:** `Distance` verb

**Constraints:**
- Symmetric: `distance(a, b) = distance(b, a)`
- `distance(a, a) = 0` (or max similarity)
- May use cosine similarity or Euclidean distance

### `move(state, delta)`

Translates a state vector by a delta vector.

**Parameters:**
- `state` (Float32Array): Current state vector
- `delta` (Float32Array): Movement vector

**Returns:**
- Float32Array: New state `state + delta`

**DSL Mapping:** `Move` verb

**Constraints:**
- Equivalent to `add(state, delta)`
- Represents continuous transformation in conceptual space

### `modulate(v, operand)`

Polymorphic modulation: scales a vector by either another vector (gating) or a scalar (scaling).

**Parameters:**
- `v` (Float32Array): Input vector
- `operand` (Float32Array | number): Gate vector or scalar multiplier

**Returns:**
- Float32Array: Modulated vector

**DSL Mapping:** `Modulate` verb

**Behaviour:**
- If `operand` is a **number** (scalar): returns `v * operand` (scalar multiplication)
- If `operand` is a **vector**: returns element-wise product `result[i] = v[i] * operand[i]`

**Constraints:**
- Type checking: `typeof operand === 'number'` determines behavior
- Scalar mode enables `Evaluate` to transform truth degrees into truth vectors
- Vector mode enables gating (attention-like mechanisms)

**Examples:**
```javascript
// Scalar mode (for Evaluate)
modulate(Truth, 0.8)  // Returns 0.8 * Truth

// Vector mode (for gating)
modulate(info, gate)  // Returns info ⊙ gate (Hadamard product)
```

### `identity(v)`

Returns the input vector unchanged. Used when DSL syntax requires a verb but no transformation is needed.

**Parameters:**
- `v` (Float32Array): Input vector

**Returns:**
- Float32Array: Copy of input vector

**DSL Mapping:** `Identity` verb

**Constraints:**
- Must return a new copy, not a reference (to preserve immutability)
- `identity(identity(v)) ≈ identity(v)`

### `normalise(v)`

Normalizes a vector to unit length.

**Parameters:**
- `v` (Float32Array): Input vector

**Returns:**
- Float32Array: Unit vector in the same direction (norm = 1)

**DSL Mapping:** `Normalise` verb

**Constraints:**
- Returns zero vector if input is zero vector
- Norm of result should be ≈ 1.0 (within floating-point tolerance)
- Idempotent: `normalise(normalise(v)) ≈ normalise(v)`
