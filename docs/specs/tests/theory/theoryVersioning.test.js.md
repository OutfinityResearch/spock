# DS tests/theory/theoryVersioning.test.js

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Unit tests for `src/theory/theoryVersioning.js` - Theory branching and merging |
| **Tests module** | `src/theory/theoryVersioning.js` |
| **Test count** | 27 tests across 9 categories |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Tests URS** | URS-005 (Theory and context management) |
| **Tests FS** | FS-06 (Theory versioning), FS-04 (Theory overlays) |
| **Tests DS** | DS-TheoryVersioning |

## Test Categories

### Utility Functions - generateBranchName / parseBranchName

| Test | Description |
|------|-------------|
| generateBranchName creates proper branch name | "base__feature" format |
| parseBranchName extracts base and branch | Splits on "__" delimiter |
| parseBranchName handles no branch | Returns null for base-only names |
| parseBranchName handles nested branches | Handles "base__a__b" |

### branchTheory - Create Theory Branches

| Test | Description |
|------|-------------|
| creates a branch from existing theory | Returns new descriptor with parent |
| branch copies AST from source | Deep copy of statements |
| branch throws for non-existent source | TheoryNotFoundError |

### mergeTheory - Merge Theory Branches

| Test | Description |
|------|-------------|
| merges source into target | Combines statements from both |
| merge handles conflicts with target strategy | Keeps target version on conflict |
| merge handles conflicts with source strategy | Uses source version on conflict |

### useTheory - Load Theory into Session

| Test | Description |
|------|-------------|
| loads theory as session overlay | Adds to session.overlays |
| useTheory throws for missing theory | TheoryNotFoundError |

### rememberToTheory - Persist Session to Theory

| Test | Description |
|------|-------------|
| persists session symbols to theory | Saves symbols to theory AST |
| rememberToTheory creates new theory if missing | Auto-creates theory file |

### listBranches - List Theory Branches

| Test | Description |
|------|-------------|
| lists branches of a theory | Returns array of branch names |
| listBranches returns empty for non-existent base | Empty array for missing |

### getVersionHistory - Version Tracking

| Test | Description |
|------|-------------|
| returns version history for theory | Array of version entries |
| getVersionHistory returns empty for non-existent | Empty array for missing |

### Verb Registry - isTheoryVerb / getTheoryVerb

| Test | Description |
|------|-------------|
| recognizes UseTheory verb | Registered as theory verb |
| recognizes Remember verb | Registered as theory verb |
| recognizes BranchTheory verb | Registered as theory verb |
| recognizes MergeTheory verb | Registered as theory verb |
| rejects non-theory verbs | Add, Distance not theory verbs |
| getTheoryVerb returns function for valid verb | Function retrieval works |
| getTheoryVerb returns null for invalid verb | Null for invalid verbs |

### THEORY_VERBS - Verb Map

| Test | Description |
|------|-------------|
| THEORY_VERBS has all required verbs | UseTheory, Remember, BranchTheory, MergeTheory |
| THEORY_VERBS values are functions | All entries are callable |

## Key Assertions

- Branches create unique versionIds
- Merge strategies: target, source, both
- Theories persist to filesystem with AST and metadata
- Theory names support "__" branch separator

## Run

```bash
DEBUG=false node tests/theory/theoryVersioning.test.js
```
