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

### `mergeTheory(theoryA, theoryB, conflictResolver)`

Merges two theory versions into one.

**Parameters:**
- `theoryA` (TheoryDescriptor): First theory
- `theoryB` (TheoryDescriptor): Second theory
- `conflictResolver` (function): Callback for resolving conflicts

**Returns:**
- Merged TheoryDescriptor

**DSL Mapping:** `MergeTheory` verb

**Merge Strategy:**
1. Identify common ancestor (if exists)
2. Collect changes from both branches
3. Apply non-conflicting changes
4. Call `conflictResolver` for conflicts
5. Create new theory with merged content

## Conflict Resolution

```javascript
conflictResolver(conflict) {
  // conflict = {
  //   name: string,        // Declaration name
  //   valueA: Statement,   // Statement from theoryA
  //   valueB: Statement,   // Statement from theoryB
  //   ancestorValue: Statement | null  // Original if exists
  // }
  // Returns: Statement (chosen resolution)
}
```

**Conflict Types:**
- Same declaration with different statements
- Deleted in one branch, modified in other

## Version History

Branch/merge operations maintain a history graph:

```
v1 (original)
 ├── v2 (branch A)
 │    └── v4 (merged A+B)
 └── v3 (branch B)
```
