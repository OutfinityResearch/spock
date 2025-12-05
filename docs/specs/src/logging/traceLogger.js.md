# DS src/logging/traceLogger.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Record execution traces as DSL-level statements that can be replayed as `DSL_OUTPUT` for explainability and evaluation. |
| **Public functions** | `startTrace(contextId)`, `logStep(contextId, dslStatement)`, `endTrace(contextId)` |
| **Depends on** | None |
| **Used by** | `src/dsl/executor.js`, `src/eval/evalRunner.js`, `src/api/sessionApi.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-008 Explainability and evaluation |
| **Implements FS** | FS-07 Explainable outputs and evaluation format |
| **Implements DS** | DS DSL engine and execution |

## Trace Structure

```javascript
{
  contextId: string,
  startTime: Date,
  endTime: Date | null,
  steps: TraceStep[],
  status: 'active' | 'completed'
}
```

## TraceStep Structure

```javascript
{
  index: number,            // Step number
  dslStatement: string,     // e.g., "@fact1 a In b"
  timestamp: Date,
  inputs: {
    subject: string,        // Resolved subject name
    verb: string,
    object: string
  },
  output: {
    declaration: string,    // @varName
    type: string,          // 'vector' | 'numeric' | 'macro'
    summary: string        // Brief description
  }
}
```

## Function Specifications

### `startTrace(contextId)`

Initiates a new trace for a context.

**Parameters:**
- `contextId` (string): Unique identifier (e.g., session ID)

**Returns:**
- Trace object

**Behaviour:**
- Creates empty trace
- Records start time
- Sets status to 'active'

### `logStep(contextId, dslStatement)`

Logs a single execution step.

**Parameters:**
- `contextId` (string): Context identifier
- `dslStatement` (string): The DSL statement being executed

**Behaviour:**
- Appends step to trace
- Records timestamp
- Extracts input/output information

### `endTrace(contextId)`

Finalizes a trace and returns immutable snapshot.

**Parameters:**
- `contextId` (string): Context identifier

**Returns:**
- Completed Trace object

**Behaviour:**
- Records end time
- Sets status to 'completed'
- Returns immutable copy
- Releases internal resources

## DSL_OUTPUT Generation

The trace can be converted to a replayable DSL script:

```javascript
function traceToScript(trace) {
  return trace.steps
    .map(step => step.dslStatement)
    .join('\n');
}
```

## Example Trace

Input execution:
```spockdsl
@fact1 Socrates Is Human
@fact2 Humans Are Mortal
@query fact1 Implies fact2
```

Trace output:
```javascript
{
  contextId: "session-123",
  steps: [
    { index: 0, dslStatement: "@fact1 Socrates Is Human", ... },
    { index: 1, dslStatement: "@fact2 Humans Are Mortal", ... },
    { index: 2, dslStatement: "@query fact1 Implies fact2", ... }
  ]
}
```
