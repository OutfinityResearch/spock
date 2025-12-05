# DS tests/run.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Main test runner script for developers. Orchestrates which test suites to run (single file, group, or all). |
| **Test style** | Developer testing (orchestrator only, minimal assertions). |

## Expected Behaviour

- Parse CLI arguments like `--suite kernel`, `--suite dsl`, `--file tests/dsl/parser.test.js`, or `--all`
- Discover and execute selected test files
- Aggregate results
- Exit with non-zero status on failures
- Provide simple reporting (per-file pass/fail, totals)

## CLI Interface

```bash
# Run all tests
node tests/run.js --all

# Run specific suite
node tests/run.js --suite kernel
node tests/run.js --suite dsl

# Run specific file
node tests/run.js --file tests/dsl/parser.test.js
```

## Available Suites

| Suite | Test Files |
|-------|------------|
| `kernel` | vectorSpace.test.js, primitiveOps.test.js, numericKernel.test.js |
| `dsl` | tokenizer.test.js, parser.test.js, dependencyGraph.test.js, executor.session.test.js |
| `theory` | theoryStore.test.js, theoryVersioning.test.js |
| `session` | sessionManager.test.js |
| `logging` | traceLogger.test.js |
| `api` | engineFactory.test.js, sessionApi.test.js |
| `eval` | taskLoader.test.js, evalRunner.test.js |
| `viz` | projectionService.test.js, vizApi.smoke.test.js |
| `config` | config.test.js |

## Output Format

```
Running tests...

kernel/vectorSpace.test.js .......... PASS (12 tests)
kernel/primitiveOps.test.js ......... PASS (8 tests)
dsl/parser.test.js .................. PASS (15 tests)
dsl/executor.session.test.js ........ FAIL (3/5 tests)

Summary:
  Total: 38 tests
  Passed: 35
  Failed: 3

Exit code: 1
```
