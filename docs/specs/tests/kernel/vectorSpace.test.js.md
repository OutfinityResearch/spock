# DS tests/kernel/vectorSpace.test.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Unit tests for pure functions in `src/kernel/vectorSpace.js`. |
| **Test style** | Pure unit tests. |
| **Functions under test** | `createVector`, `cloneVector`, `dot`, `norm`, `normalise`. |

## Test Cases

### createVector

| Test | Input | Expected |
|------|-------|----------|
| Creates vector with correct dimension | `createVector(512)` | Float32Array of length 512 |
| Initializes to zeros | `createVector(10)` | All elements are 0 |
| Handles small dimensions | `createVector(1)` | Single-element array |

### cloneVector

| Test | Input | Expected |
|------|-------|----------|
| Creates deep copy | `cloneVector(v)` | New array with same values |
| No shared references | Modify clone | Original unchanged |
| Same dimension | `cloneVector(v).length` | Equals `v.length` |

### dot

| Test | Input | Expected |
|------|-------|----------|
| Orthogonal vectors | `dot([1,0], [0,1])` | 0 |
| Parallel vectors | `dot([1,2], [1,2])` | 5 |
| Zero vector | `dot([0,0], [1,1])` | 0 |
| Negative values | `dot([1,-1], [-1,1])` | -2 |

### norm

| Test | Input | Expected |
|------|-------|----------|
| Unit vector | `norm([1,0,0])` | 1 |
| Zero vector | `norm([0,0,0])` | 0 |
| General vector | `norm([3,4])` | 5 |

### normalise

| Test | Input | Expected |
|------|-------|----------|
| Non-zero vector | `normalise([3,4])` | `[0.6, 0.8]` |
| Already normalized | `normalise([1,0])` | `[1, 0]` |
| Zero vector | `normalise([0,0])` | `[0, 0]` (no NaN) |
| Idempotent | `normalise(normalise(v))` | Same as `normalise(v)` |

## Scope

- No I/O, no global state
- All tests must be deterministic and fast
- Use small vectors to minimize floating-point noise
