# DS src/dsl/executor.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Execute parsed scripts and macros using geometric and numeric kernels, theory overlays and session symbol tables, while producing DSL traces. |
| **Public functions** | `executeScript(ast, context)`, `executeMacro(astMacro, context)`, `executeVerbMacro(astVerb, subjectVec, objectVec, context)` |
| **Depends on** | `src/kernel/primitiveOps.js`, `src/kernel/numericKernel.js`, `src/dsl/dependencyGraph.js`, `src/logging/traceLogger.js`, `src/session/sessionManager.js` |
| **Used by** | `src/api/sessionApi.js`, `src/viz/vizApi.js`, `src/eval/evalRunner.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-004 DSL requirements, URS-008 Explainability and evaluation |
| **Implements FS** | FS-01 Core conceptual model (runtime behaviour), FS-03 Syntax and macro semantics, FS-07 Explainable outputs and evaluation format |
| **Implements DS** | DS DSL engine and execution |

## Execution Context

```javascript
{
  session: SessionObject,       // Current session
  theories: Map<string, Theory>,// Loaded theories
  symbols: Map<string, Value>,  // Local symbol table
  traceId: string,              // For trace logging
  config: ConfigObject          // Runtime configuration
}
```

## Function Specifications

### `executeScript(ast, context)`

Executes an entire script AST within a context.

**Parameters:**
- `ast` (ScriptAST): Parsed script
- `context` (ExecutionContext): Execution context

**Returns:**
```javascript
{
  result: Value,          // Final result value
  symbols: Map,           // All declared symbols
  trace: DSLTrace         // Execution trace
}
```

**Behaviour:**
1. Process all macros first (register theories/verbs)
2. Execute top-level statements in dependency order
3. Return final state and trace

### `executeMacro(astMacro, context)`

Executes a macro (theory, verb, or session).

**Parameters:**
- `astMacro` (MacroAST): Parsed macro
- `context` (ExecutionContext): Execution context

**Returns:**
- Updated context with macro effects

**Behaviour by declarationType:**

| Type | Behaviour |
|------|-----------|
| `theory` | Register all facts and verb definitions in global/session scope |
| `verb` | Register verb definition for later invocation |
| `session` | Create temporary scope, execute body, then clean up |

### `executeVerbMacro(astVerb, subjectVec, objectVec, context)`

Executes a user-defined verb macro.

**Parameters:**
- `astVerb` (MacroAST): Verb macro AST
- `subjectVec` (Float32Array): Subject hypervector
- `objectVec` (Float32Array): Object hypervector
- `context` (ExecutionContext): Execution context

**Returns:**
- Float32Array: The `@result` hypervector

**Behaviour:**
1. Bind `$subject` to `subjectVec`
2. Bind `$object` to `objectVec`
3. Execute macro body in dependency order
4. Return value of `@result`

## Execution Flow

```
executeScript(ast, context)
    ├── Register macros (theories, verbs)
    ├── Build dependency graph for statements
    ├── topoSort() to get execution order
    └── For each statement in order:
            ├── resolveSymbol(subject)
            ├── resolveVerb(verb)
            ├── resolveSymbol(object)
            ├── dispatch to kernel or verb macro
            ├── store result under @declaration
            └── log trace step
```

## Verb Dispatch

| Verb Type | Dispatch Target |
|-----------|-----------------|
| Kernel verbs (`Add`, `Bind`, etc.) | `src/kernel/primitiveOps.js` |
| Numeric verbs (`AddNumeric`, etc.) | `src/kernel/numericKernel.js` |
| User-defined verbs | `executeVerbMacro()` |
| Theory management (`UseTheory`, etc.) | Session manager |

## Trace Logging

Every executed statement is logged with:
- Statement DSL text
- Input vectors/values
- Output vector/value
- Timestamp
