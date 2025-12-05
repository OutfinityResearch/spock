# DS tests/kernel/primitiveOps.test.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Unit tests for geometric primitive operations in `src/kernel/primitiveOps.js`. |
| **Test style** | Pure unit tests. |
| **Functions under test** | `add`, `bind`, `negate`, `distance`, `move`, `modulate`. |

## Test Cases

### add

| Test | Input | Expected |
|------|-------|----------|
| Basic addition | `add([1,2], [3,4])` | `[4, 6]` |
| Commutativity | `add(a, b)` vs `add(b, a)` | Same result |
| Identity (zero) | `add([1,2], [0,0])` | `[1, 2]` |
| Negative values | `add([1,-2], [-1,2])` | `[0, 0]` |

### bind

| Test | Input | Expected |
|------|-------|----------|
| Element-wise product | `bind([2,3], [4,5])` | `[8, 15]` |
| Identity (ones) | `bind([1,2], [1,1])` | `[1, 2]` |
| Zero element | `bind([1,2], [0,1])` | `[0, 2]` |

### negate

| Test | Input | Expected |
|------|-------|----------|
| Basic negation | `negate([1,-2])` | `[-1, 2]` |
| Double negation | `negate(negate(v))` | `v` |
| Zero vector | `negate([0,0])` | `[0, 0]` |

### distance

| Test | Input | Expected |
|------|-------|----------|
| Same vectors | `distance(v, v)` | 0 (or max similarity) |
| Symmetry | `distance(a, b)` vs `distance(b, a)` | Same |
| Orthogonal | `distance([1,0], [0,1])` | Known value |

### move

| Test | Input | Expected |
|------|-------|----------|
| Basic move | `move([1,2], [3,4])` | `[4, 6]` |
| Zero delta | `move([1,2], [0,0])` | `[1, 2]` |
| Equivalence to add | `move(a, b)` | Same as `add(a, b)` |

### modulate

| Test | Input | Expected |
|------|-------|----------|
| Basic modulation | `modulate([4,6], [0.5,0.5])` | `[2, 3]` |
| Zero gate | `modulate([1,2], [0,0])` | `[0, 0]` |
| Full gate | `modulate([1,2], [1,1])` | `[1, 2]` |

## Scope

- Uses small artificial vectors to avoid numeric noise
- No dependency on higher-level modules
- All tests are deterministic
