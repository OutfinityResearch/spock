# DS src/api/engineFactory.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Provide the main public entry point `createSpockEngine`, wire up configuration, theory loading and session creation. |
| **Public functions** | `createSpockEngine(options)` |
| **Depends on** | `src/session/sessionManager.js`, `src/dsl/parser.js`, `src/dsl/executor.js`, `src/config/config.js`, `src/theory/theoryStore.js` |
| **Used by** | Applications embedding Spock, `src/viz/vizApi.js`, `src/eval/evalRunner.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-006 Implementation platform, URS-007 LLM interface |
| **Implements FS** | FS-06 Public API |
| **Implements DS** | DS Kernel architecture |

## Engine Interface

```javascript
{
  createSession(): SpockSession,
  loadTheory(name: string): TheoryDescriptor,
  listTheories(): string[],
  getConfig(): ConfigObject,
  shutdown(): void
}
```

## Options Schema

```javascript
{
  workingFolder: string,     // Default: '.spock'
  dimensions: number,        // Vector dimensions (512, 1024, etc.)
  defaultTheories: string[], // Theories to preload
  logLevel: string           // 'silent' | 'summary' | 'full'
}
```

## Function Specifications

### `createSpockEngine(options)`

Creates and initializes a Spock engine instance.

**Parameters:**
- `options` (EngineOptions): Configuration options

**Returns:**
- SpockEngine object

**Behaviour:**
1. Merge options with defaults from config
2. Initialize working folder if needed
3. Load default theories
4. Return engine interface

**Example:**
```javascript
const engine = createSpockEngine({
  workingFolder: './my-project/.spock',
  dimensions: 1024,
  defaultTheories: ['BasicLogic', 'NumericOps']
});

const session = engine.createSession();
```

## Default Theories

The engine automatically loads certain base theories:
- `CoreVerbs` - Basic kernel verb definitions
- `BasicLogic` - Logical operators

## Engine Lifecycle

```
createSpockEngine(options)
    ↓
Initialize config
    ↓
Create/verify working folder
    ↓
Load default theories
    ↓
Ready for createSession() calls
    ↓
... application usage ...
    ↓
shutdown() - cleanup resources
```

## Error Handling

| Error | Cause |
|-------|-------|
| `ConfigurationError` | Invalid options |
| `FolderAccessError` | Can't create/access working folder |
| `TheoryLoadError` | Default theory not found or invalid |
