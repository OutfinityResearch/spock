# DS src/session/sessionManager.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Create and manage sessions, including local symbol tables and theory overlays; provide uniform symbol resolution for the executor. |
| **Public functions** | `createSession(initialTheories)`, `getSymbol(session, name)`, `setSymbol(session, name, value)`, `overlayTheory(session, theoryDescriptor)` |
| **Depends on** | `src/theory/theoryStore.js`, `src/theory/theoryVersioning.js`, `src/config/config.js` |
| **Used by** | `src/dsl/executor.js`, `src/api/sessionApi.js`, `src/viz/vizApi.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-005 Theory and context management, URS-006 Implementation platform |
| **Implements FS** | FS-01 Core conceptual model (sessions), FS-04 Theories, sessions, overlays and versions |
| **Implements DS** | DS Kernel architecture |

## Session Structure

```javascript
{
  id: string,                           // Unique session ID
  localSymbols: Map<string, Value>,     // Local declarations
  overlays: TheoryDescriptor[],         // Overlaid theories (ordered)
  createdAt: Date,
  config: ConfigObject
}
```

## Symbol Resolution Order

When resolving a name:
1. Check local session symbols first
2. Check overlaid theories in reverse order (most recent first)
3. Check global/default theories
4. Return `undefined` if not found

## Function Specifications

### `createSession(initialTheories)`

Creates a new session with optional initial theory overlays.

**Parameters:**
- `initialTheories` (string[]): Names of theories to overlay initially

**Returns:**
- New Session object

**Behaviour:**
1. Generate unique session ID
2. Initialize empty local symbol table
3. Load and overlay initial theories
4. Return session object

### `getSymbol(session, name)`

Resolves a symbol name within a session context.

**Parameters:**
- `session` (Session): The session
- `name` (string): Symbol name (with or without `@`)

**Returns:**
- Resolved value (hypervector, numeric, or macro)
- `undefined` if not found

**Resolution Order:**
1. Local symbols
2. Overlay theories (LIFO)
3. Global theories

### `setSymbol(session, name, value)`

Declares or updates a local symbol.

**Parameters:**
- `session` (Session): The session
- `name` (string): Symbol name
- `value` (Value): Value to bind

**Behaviour:**
- Always sets in local symbol table
- Shadows any theory-level definitions

### `overlayTheory(session, theoryDescriptor)`

Adds a theory overlay to the session.

**Parameters:**
- `session` (Session): The session
- `theoryDescriptor` (TheoryDescriptor): Theory to overlay

**DSL Mapping:** `UseTheory` verb

**Behaviour:**
- Adds theory to end of overlays array
- Does NOT copy theory content
- Makes theory symbols visible in resolution

## Session Lifecycle

```
createSession()
    ↓
overlayTheory() × N
    ↓
setSymbol() / getSymbol() during execution
    ↓
Session ends → local symbols discarded
```

## Isolation Guarantees

- Sessions do not share local symbols
- Modifications to local symbols don't affect theories
- Concurrent sessions are isolated
