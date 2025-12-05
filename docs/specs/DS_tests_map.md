# DS Test Suite Map

**ID:** DS_tests_map

This document provides a quick reference to all test specifications for Spock GOS.

## Test Runner

| Spec | Description |
|------|-------------|
| [tests/run.js.md](tests/run.js.md) | Test runner orchestration |

## Kernel Layer Tests

| Component | Test Spec | Tests DS |
|-----------|-----------|----------|
| VectorSpace | [vectorSpace.test.js.md](tests/kernel/vectorSpace.test.js.md) | [vectorSpace.js](src/kernel/vectorSpace.js.md) |
| PrimitiveOps | [primitiveOps.test.js.md](tests/kernel/primitiveOps.test.js.md) | [primitiveOps.js](src/kernel/primitiveOps.js.md) |
| NumericKernel | [numericKernel.test.js.md](tests/kernel/numericKernel.test.js.md) | [numericKernel.js](src/kernel/numericKernel.js.md) |

## DSL Engine Tests

| Component | Test Spec | Tests DS |
|-----------|-----------|----------|
| Tokenizer | [tokenizer.test.js.md](tests/dsl/tokenizer.test.js.md) | [tokenizer.js](src/dsl/tokenizer.js.md) |
| Parser | [parser.test.js.md](tests/dsl/parser.test.js.md) | [parser.js](src/dsl/parser.js.md) |
| DependencyGraph | [dependencyGraph.test.js.md](tests/dsl/dependencyGraph.test.js.md) | [dependencyGraph.js](src/dsl/dependencyGraph.js.md) |
| Executor | [executor.session.test.js.md](tests/dsl/executor.session.test.js.md) | [executor.js](src/dsl/executor.js.md) |

## Test Style Guide

- **Pure unit tests**: Test a single function/module in isolation
- **Integration tests**: Test multiple modules working together
- **All tests must be deterministic**: Same input → same output

## Related

- [Design Spec Map](DS_map.md)
- [Evaluation Suite Map](DS_eval_map.md)
- [Full Traceability Matrix](matrix.html)
