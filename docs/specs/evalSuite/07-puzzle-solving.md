# DS evalSuite/07-puzzle-solving/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 07-puzzle-solving |
| **Goal** | Test constraint-based reasoning and backtracking on a small puzzle. |
| **Theory focus** | A `PuzzleTheory` encoding simple constraints (for example a tiny two-colour map-colouring or seating puzzle) and a `Solve` verb. |
| **Engine aspects** | Backtracking search, failure handling, constraint satisfaction. |

## Example Task

| Field | Value |
|-------|-------|
| **NL_TASK** | Colour two connected regions A and B with two colours Red and Blue so that adjacent regions do not share the same colour. |
| **TASK_TYPE** | Solve |

### DSL_OUTPUT (excerpt)

```spockdsl
@PuzzleResult session begin
    @assignA A HasColor Red
    @assignB B HasColor Blue
end
```

### NL_OUTPUT

The system finds a consistent assignment such as A=Red, B=Blue that satisfies the adjacency constraint.

## Tasks Summary

10 tasks testing constraint satisfaction problems.
