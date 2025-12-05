# DS tests/dsl/executor.session.test.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Integration tests for `src/dsl/executor.js` together with sessions and basic kernels. |
| **Test style** | Developer integration tests. |
| **Functions under test** | `executeScript`, `executeMacro` in a real Session context. |

## Test Cases

### Basic Execution

| Test | Description |
|------|-------------|
| Simple theory | Execute theory macro, verify facts registered |
| Session overlay | UseTheory makes symbols visible |
| Verb execution | User-defined verb returns @result |
| Trace generation | Execution produces valid DSL trace |

### Dependency Order

| Test | Description |
|------|-------------|
| Reorder test | Shuffled statements produce same result |
| Forward reference | Later statement references earlier one |

### Symbol Resolution

| Test | Description |
|------|-------------|
| Local priority | Local shadows theory symbol |
| Theory overlay | Multiple theories, correct resolution order |
| Not found | Missing symbol produces clear error |

## Scope

- Uses in-memory theories and sessions
- No disk I/O
- May stub theoryStore if needed
