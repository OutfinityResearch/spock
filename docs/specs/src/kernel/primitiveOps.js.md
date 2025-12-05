# DS src/kernel/primitiveOps.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Implement geometric primitive verbs that correspond to `Add`, `Bind`, `Negate`, `Distance`, `Move`, `Modulate` as pure vector operations. |
| **Public functions** | `add(a, b)`, `bind(a, b)`, `negate(v)`, `distance(a, b)`, `move(state, delta)`, `modulate(info, gate)` |
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

### `modulate(info, gate)`

Modulates information vector by a gate vector.

**Parameters:**
- `info` (Float32Array): Information vector
- `gate` (Float32Array): Gate/scale vector

**Returns:**
- Float32Array: Modulated vector

**DSL Mapping:** `Modulate` verb

**Constraints:**
- Element-wise scaling: `result[i] = info[i] * gate[i]`
- Gate values typically in [0, 1] for attenuation
