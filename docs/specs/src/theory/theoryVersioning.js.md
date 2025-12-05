# DS src/theory/theoryVersioning.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Implement branching and merging of theories in memory, independent of persistence; manage theory version metadata. |
| **Public functions** | `branchTheory(baseTheory, newName)`, `mergeTheory(theoryA, theoryB, conflictResolver)` |
| **Depends on** | `src/theory/theoryStore.js` (types and descriptors only) |
| **Used by** | `src/session/sessionManager.js`, high-level tools that need versioning |

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

### `branchTheory(baseTheory, newName)`

Creates an in-memory branch of an existing theory.

**Parameters:**
- `baseTheory` (TheoryDescriptor): Theory to branch from
- `newName` (string): Name for the new branch

**Returns:**
- New TheoryDescriptor with:
  - Same content as base
  - New unique `versionId`
  - `parentVersionId` = base's `versionId`
  - Name = `newName`

**DSL Mapping:** `BranchTheory` verb

**Example:**
```spockdsl
@branchPhysics ClassicalPhysics BranchTheory ExperimentalPhysics
```

### `mergeTheory(theoryA, theoryB, strategy)`

Merges two theory versions into one using a DSL-based strategy.

**Parameters:**
- `theoryA` (TheoryDescriptor): First (base) theory
- `theoryB` (TheoryDescriptor): Second (overlay) theory
- `strategy` (string): Merge strategy name (default: `'consensus'`)

**Returns:**
- Merged TheoryDescriptor

**DSL Mapping:** `MergeTheory` verb

## Merge Strategies

The system provides predefined, DSL-compatible merge strategies (no JavaScript callbacks):

### Strategy: `'consensus'` (default)

For **vector values** (concepts, facts): Geometric average.

```javascript
mergedVector = Normalise(Add(vecA, vecB))
```

This places the merged concept at the "midpoint" direction between both theories.

### Strategy: `'override'`

For **macro definitions** (verbs, rules): Second theory wins.

```javascript
if (theoryB.has(name)) {
  merged[name] = theoryB.get(name);
} else {
  merged[name] = theoryA.get(name);
}
```

The overlay theory's definitions replace the base theory's definitions with the same name.

### Strategy: `'keep_base'`

Opposite of override - first theory wins on conflicts.

### Strategy: `'fail_on_conflict'`

Throws an error if any name appears in both theories with different values.

## Merge Algorithm

```
mergeTheory(A, B, strategy):
    merged = new Theory()

    for name in union(A.names, B.names):
        if name only in A:
            merged[name] = A[name]
        else if name only in B:
            merged[name] = B[name]
        else:  # conflict
            if A[name].type == 'VECTOR' and strategy == 'consensus':
                merged[name] = Normalise(Add(A[name], B[name]))
            else if strategy == 'override':
                merged[name] = B[name]
            else if strategy == 'keep_base':
                merged[name] = A[name]
            else:
                throw ConflictError(name)

    return merged
```

**Design Rationale:** DSL-based strategies maintain the geometric abstraction. JavaScript callbacks would break the pure DSL model and make reasoning non-reproducible.

## Version History

Branch/merge operations maintain a history graph:

```
v1 (original)
 ├── v2 (branch A)
 │    └── v4 (merged A+B)
 └── v3 (branch B)
```
