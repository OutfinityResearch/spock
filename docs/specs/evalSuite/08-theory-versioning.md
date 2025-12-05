# DS evalSuite/08-theory-versioning/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 08-theory-versioning |
| **Goal** | Test branching and merging of theories and meta-reasoning between different theory versions. |
| **Theory focus** | A base `MeasurementTheory` and a branched `MeasurementTheoryExp` with slight changes; verbs `BranchTheory`, `MergeTheory`, `EvaluateTheory`, `CompareTheories`. |
| **Engine aspects** | Theory version metadata, correct branch/merge behaviour, comparative evaluation. |

## Example Task

| Field | Value |
|-------|-------|
| **NL_TASK** | Branch MeasurementTheory into MeasurementTheoryExp, adjust a rule in the branch and compare which version better explains a small dataset. |
| **TASK_TYPE** | Ask |

### DSL_OUTPUT (excerpt)

```spockdsl
@VersionResult session begin
    @useMain local UseTheory MeasurementTheory
    @useExp local UseTheory MeasurementTheoryExp

    @betterTheory MeasurementTheoryExp Is Preferred
end
```

### NL_OUTPUT

The system creates a branch, modifies it and then reports which theory version has the better evaluation score for the given data.

## Tasks Summary

10 tasks testing theory versioning, branching, and merging.
