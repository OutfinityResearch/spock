# DS src/theory/theoryStore.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Load, save and list theories stored on disk in the `.spock` folder; convert between on-disk DSL and in-memory representations. |
| **Public functions** | `loadTheory(name)`, `saveTheory(theoryDescriptor)`, `listTheories()` |
| **Depends on** | Node.js `fs`, `src/dsl/parser.js`, `src/config/config.js` |
| **Used by** | `src/session/sessionManager.js`, `src/theory/theoryVersioning.js`, `src/api/engineFactory.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-005 Theory and context management, URS-006 Implementation platform |
| **Implements FS** | FS-04 Theories, sessions, overlays and versions |
| **Implements DS** | DS Theory storage and versioning |

## Storage Layout

```
.spock/
├── theories/
│   ├── BasicLogic/
│   │   ├── theory.spockdsl
│   │   └── metadata.json
│   ├── Physics/
│   │   ├── theory.spockdsl
│   │   └── metadata.json
│   └── ...
└── config.json
```

## Theory Descriptor

```javascript
{
  name: string,           // Theory name
  versionId: string,      // Current version ID
  parentVersionId: string | null,  // Parent for branches
  ast: MacroAST,          // Parsed theory AST
  vectors: Map<string, Float32Array>  // Prototype vectors
}
```

## Metadata Schema

```javascript
{
  theoryId: string,
  versionId: string,
  parentVersionId: string | null,
  createdAt: string,      // ISO timestamp
  updatedAt: string       // ISO timestamp
}
```

## Function Specifications

### `loadTheory(name)`

Loads a theory from disk by name.

**Parameters:**
- `name` (string): Theory name

**Returns:**
- TheoryDescriptor object

**Behaviour:**
1. Locate theory folder in `.spock/theories/{name}/`
2. Read `theory.spockdsl` file
3. Parse DSL into AST
4. Read `metadata.json`
5. Reconstruct prototype vectors if cached
6. Return complete descriptor

**Errors:**
- `TheoryNotFoundError` if folder doesn't exist
- `ParseError` if DSL is malformed

### `saveTheory(theoryDescriptor)`

Saves a theory to disk.

**Parameters:**
- `theoryDescriptor` (TheoryDescriptor): Theory to save

**Behaviour:**
1. Create folder if not exists
2. Serialize AST back to DSL text
3. Write `theory.spockdsl`
4. Update `metadata.json`
5. Optionally cache prototype vectors

**DSL Mapping:** Used by `Remember` verb

### `listTheories()`

Lists all available theories.

**Returns:**
- Array of theory names (strings)

**Behaviour:**
- Scan `.spock/theories/` directory
- Return folder names
