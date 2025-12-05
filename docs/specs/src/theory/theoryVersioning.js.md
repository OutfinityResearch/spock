# DS src/theory/theoryVersioning.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Implement branching and merging of theories in memory, independent of persistence; manage theory version metadata. |
| **Public functions** | `branchTheory(sourceName, branchName, options)`, `mergeTheory(targetName, sourceName, options)`, `useTheory(session, theoryName, options)`, `rememberToTheory(session, theoryName, options)`, `isTheoryVerb(verbName)`, `getTheoryVerb(verbName)` |
| **Depends on** | `src/theory/theoryStore.js`, `src/kernel/vectorSpace.js`, `src/config/config.js`, `src/dsl/parser.js` |
| **Used by** | `src/dsl/executor.js`, `src/session/sessionManager.js`, high-level tools that need versioning |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-005 Theory and context management (branch/merge) |
| **Implements FS** | FS-04 Theories, sessions, overlays and versions |
| **Implements DS** | DS Theory storage and versioning |

## Version Metadata

```javascript
{
  versionId: string,        // Unique version identifier
  parentVersionId: string,  // Parent version for ancestry
  branchName: string,       // Name of the branch
  timestamp: string         // Creation timestamp
}
```

## Function Specifications

### `branchTheory(sourceName, branchName, options)`

Creates a branch of an existing theory.

**Parameters:**
- `sourceName` (string): Name of the source theory
- `branchName` (string): Identifier for the new branch
- `options` (object): Optional settings
  - `overwrite` (boolean): Overwrite existing branch if true

**Returns:**
- New TheoryDescriptor with:
  - Deep copy of source AST and vectors
  - New unique `versionId`
  - `parentVersionId` = source's `versionId`
  - Name = `{sourceName}__{branchName}`

**DSL Mapping:** `BranchTheory` verb

**Example:**
```spockdsl
@branchPhysics ClassicalPhysics BranchTheory ExperimentalPhysics
```

### `mergeTheory(targetName, sourceName, options)`

Merges two theory versions into one.

**Parameters:**
- `targetName` (string): Target (base) theory name
- `sourceName` (string): Source (overlay) theory name
- `options` (object): Merge options
  - `conflictStrategy` (string): Strategy for conflicts (default: `'target'`)

**Returns:**
- Merged TheoryDescriptor saved to target name

**DSL Mapping:** `MergeTheory` verb

## Merge Strategies

The system provides predefined merge strategies via `options.conflictStrategy`:

### Strategy: `'target'` (default)

Keep target (base) theory's value on conflicts, ignore source.

### Strategy: `'source'`

Replace with source (overlay) theory's value on conflicts.

### Strategy: `'both'`

Keep both values: rename source to `{name}_merged`.

### Strategy: `'consensus'`

For **vector values**: Geometric average (midpoint direction).

```javascript
mergedVector = Normalise(Add(targetVec, sourceVec))
```

For **statements**: Keep both under `{name}_consensus`.

This places the merged concept at the "midpoint" direction between both theories.

### Strategy: `'fail'`

Throws `MergeConflictError` if any name appears in both theories.

```javascript
throw new MergeConflictError(name, targetVersion, sourceVersion);
```

## Merge Algorithm

```
mergeTheory(targetName, sourceName, options):
    target = loadTheory(targetName)
    source = loadTheory(sourceName)
    merged = new Theory()
    strategy = options.conflictStrategy || 'target'

    # Merge AST statements
    for stmt in target.statements:
        merged.statements.add(stmt)

    for stmt in source.statements:
        if stmt.declaration in merged:
            switch strategy:
                'target': skip
                'source': replace
                'both': add with _merged suffix
                'consensus': add with _consensus suffix
                'fail': throw MergeConflictError
        else:
            merged.statements.add(stmt)

    # Merge vectors
    for name, vec in target.vectors:
        merged.vectors[name] = deepCopy(vec)

    for name, vec in source.vectors:
        if name in merged.vectors:
            switch strategy:
                'target': skip
                'source': replace
                'both': add as {name}_merged
                'consensus': merged[name] = Normalise(Add(target, source))
                'fail': throw MergeConflictError
        else:
            merged.vectors[name] = deepCopy(vec)

    return merged
```

**Design Rationale:** String-based strategies maintain the geometric abstraction and avoid JavaScript callbacks that would break reproducibility.

## Version History

Branch/merge operations maintain a history graph:

```
v1 (original)
 ├── v2 (branch A)
 │    └── v4 (merged A+B)
 └── v3 (branch B)
```
