# DS tests/dsl/dependencyGraph.test.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Unit tests for dependency graph and topological sorting in `src/dsl/dependencyGraph.js`. |
| **Test style** | Pure unit tests. |
| **Functions under test** | `buildGraph`, `topoSort`. |

## Test Cases

### buildGraph

| Test | Input | Expected |
|------|-------|----------|
| No dependencies | Independent statements | Empty edges |
| Linear chain | `@b` uses `@a`, `@c` uses `@b` | Chain edges |
| Multiple deps | `@c` uses `@a` and `@b` | Two edges to `@c` |
| Self-reference | `@a` uses `@a` | Error: self-reference |

### topoSort

| Test | Input | Expected |
|------|-------|----------|
| Linear chain | A→B→C | `[A, B, C]` |
| Parallel nodes | A, B independent | Either order valid |
| Diamond | A→B, A→C, B→D, C→D | Valid topological order |
| Cycle detection | A→B→A | Error: cycle detected |

### Tie-breaking

| Test | Scenario | Expected |
|------|----------|----------|
| Same in-degree | Multiple valid orders | Use line number as tie-breaker |
| Determinism | Same input twice | Same output order |

## Scope

- Test with hand-crafted mini ASTs, not full scripts
- Focus on graph correctness and cycle detection
