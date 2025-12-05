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
| VectorSpaceParams | [vectorSpaceParams.test.js.md](tests/kernel/vectorSpaceParams.test.js.md) | [vectorSpace.js](src/kernel/vectorSpace.js.md) |
| PrimitiveOps | [primitiveOps.test.js.md](tests/kernel/primitiveOps.test.js.md) | [primitiveOps.js](src/kernel/primitiveOps.js.md) |
| NumericKernel | [numericKernel.test.js.md](tests/kernel/numericKernel.test.js.md) | [numericKernel.js](src/kernel/numericKernel.js.md) |

## DSL Engine Tests

| Component | Test Spec | Tests DS |
|-----------|-----------|----------|
| Tokenizer | [tokenizer.test.js.md](tests/dsl/tokenizer.test.js.md) | [tokenizer.js](src/dsl/tokenizer.js.md) |
| Parser | [parser.test.js.md](tests/dsl/parser.test.js.md) | [parser.js](src/dsl/parser.js.md) |
| DependencyGraph | [dependencyGraph.test.js.md](tests/dsl/dependencyGraph.test.js.md) | [dependencyGraph.js](src/dsl/dependencyGraph.js.md) |
| Executor | [executor.test.js.md](tests/dsl/executor.test.js.md) | [executor.js](src/dsl/executor.js.md) |

## Session & API Tests

| Component | Test Spec | Tests DS |
|-----------|-----------|----------|
| SessionManager | [sessionManager.test.js.md](tests/session/sessionManager.test.js.md) | [sessionManager.js](src/session/sessionManager.js.md) |
| SessionApi | [sessionApi.test.js.md](tests/api/sessionApi.test.js.md) | [sessionApi.js](src/api/sessionApi.js.md) |
| EngineFactory | [engineFactory.test.js.md](tests/api/engineFactory.test.js.md) | [engineFactory.js](src/api/engineFactory.js.md) |

## Theory & Planning Tests

| Component | Test Spec | Tests DS |
|-----------|-----------|----------|
| TheoryStore | [theoryStore.test.js.md](tests/theory/theoryStore.test.js.md) | [theoryStore.js](src/theory/theoryStore.js.md) |
| TheoryVersioning | [theoryVersioning.test.js.md](tests/theory/theoryVersioning.test.js.md) | [theoryVersioning.js](src/theory/theoryVersioning.js.md) |
| Planner | [planner.test.js.md](tests/planning/planner.test.js.md) | [planner.js](src/planning/planner.js.md) |

## Logging Tests

| Component | Test Spec | Tests DS |
|-----------|-----------|----------|
| TraceLogger | [traceLogger.test.js.md](tests/logging/traceLogger.test.js.md) | [traceLogger.js](src/logging/traceLogger.js.md) |

## Config Tests

| Component | Test Spec | Tests DS | Status |
|-----------|-----------|----------|--------|
| Config | [config.test.js.md](tests/config/config.test.js.md) | [config.js](src/config/config.js.md) | Planned |

## Visualization Tests

| Component | Test Spec | Tests DS | Status |
|-----------|-----------|----------|--------|
| ProjectionService | [projectionService.test.js.md](tests/viz/projectionService.test.js.md) | [projectionService.js](src/viz/projectionService.js.md) | Planned |
| VizApi | [vizApi.smoke.test.js.md](tests/viz/vizApi.smoke.test.js.md) | [vizApi.js](src/viz/vizApi.js.md) | Planned |

## Test Summary

| Layer | Test Files | Description |
|-------|------------|-------------|
| Kernel | 4 | Core vector operations and numeric processing |
| DSL | 4 | Language parsing, analysis, and execution |
| Session/API | 3 | Session management and public API |
| Theory/Planning | 3 | Knowledge storage, versioning, and planning |
| Logging | 1 | Trace and debug logging |
| Config | 1 | Configuration management (planned) |
| Visualization | 2 | Projection and API server (planned) |
| **Total** | **18** | (15 implemented, 3 planned) |

## Test Style Guide

- **Pure unit tests**: Test a single function/module in isolation
- **Integration tests**: Test multiple modules working together
- **All tests must be deterministic**: Same input → same output
- **Use testFramework.js**: Consistent test assertions and reporting

## Running Tests

```bash
# Run all tests
node tests/run.js

# Run individual test file
DEBUG=false node tests/kernel/primitiveOps.test.js

# Run with debug output
DEBUG=true node tests/planning/planner.test.js
```

## Related

- [Design Spec Map](DS_map.md)
- [Evaluation Suite Map](DS_eval_map.md)
- [Full Traceability Matrix](matrix.html)
