# DS src/api/sessionApi.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Wrap a session into a simple facade that exposes the high-level methods `learn`, `ask`, `prove`, `explain`, `plan`, `solve`, `summarise`. Each method runs a DSL script and returns results plus a DSL trace. |
| **Public functions** | `createSessionApi(session)` which returns an object exposing `learn(script)`, `ask(script)`, `prove(script)`, `explain(script)`, `plan(script)`, `solve(script)`, `summarise(script)` |
| **Depends on** | `src/session/sessionManager.js`, `src/dsl/executor.js`, `src/logging/traceLogger.js` |
| **Used by** | External callers (LLMs, apps), `src/viz/vizApi.js`, tests |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-007 LLM interface, URS-008 Explainability and evaluation |
| **Implements FS** | FS-06 Public API, FS-07 Explainable outputs and evaluation format |
| **Implements DS** | DS DSL engine and execution |

## Session API Interface

```javascript
{
  learn(script: string): ApiResult,
  ask(script: string): ApiResult,
  prove(script: string): ApiResult,
  explain(script: string): ApiResult,
  plan(script: string): ApiResult,
  solve(script: string): ApiResult,
  summarise(script: string): ApiResult
}
```

## ApiResult Structure

```javascript
{
  success: boolean,
  symbols: Map<string, Value>,  // Declared symbols
  scores: {
    truth: number,              // Truth degree [0, 1]
    confidence: number          // Confidence level
  },
  trace: DSLTrace,              // Execution trace
  dslOutput: string             // Replayable DSL script
}
```

## Function Specifications

### `createSessionApi(session)`

Creates an API wrapper around a session.

**Parameters:**
- `session` (Session): An active session from sessionManager

**Returns:**
- SessionApi object with all methods

### Method Semantics

| Method | Purpose | Primary Use |
|--------|---------|-------------|
| `learn(script)` | Ingest facts and definitions | Loading knowledge |
| `ask(script)` | Query for truth values | Question answering |
| `prove(script)` | Construct formal proofs | Logical verification |
| `explain(script)` | Generate explanations | Understanding results |
| `plan(script)` | Generate action sequences | Task planning |
| `solve(script)` | Find constraint solutions | Problem solving |
| `summarise(script)` | Create summaries | Knowledge compression |

### Common Execution Flow

```javascript
method(script) {
  1. Parse script to AST
  2. Start trace logging
  3. Execute script in session context
  4. Extract results and scores
  5. End trace and generate dslOutput
  6. Return ApiResult
}
```

## Usage Example

```javascript
const engine = createSpockEngine();
const session = engine.createSession();
const api = createSessionApi(session);

// Learn some facts
const learnResult = api.learn(`
  @f1 Socrates Is Human
  @f2 Humans Are Mortal
`);

// Ask a question
const askResult = api.ask(`
  @query Socrates Is Mortal
  @result query Evaluate Truth
`);

console.log(askResult.scores.truth); // ~1.0
console.log(askResult.dslOutput);    // Replayable script
```

## Trace and DSL_OUTPUT

Every method generates a `dslOutput` that can reproduce the result:

```javascript
// Original ask
api.ask("@q Socrates Implies Mortal");

// Returns dslOutput:
// "@q Socrates Implies Mortal\n@passed q Is TrueLike"
```
