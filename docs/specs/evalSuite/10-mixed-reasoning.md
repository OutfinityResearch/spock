# DS evalSuite/10-mixed-reasoning/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 10-mixed-reasoning |
| **Goal** | Test a mixed scenario combining logic, numeric reasoning and planning in one script. |
| **Theory focus** | Combined `Logic`, `NumericExamples` and `LinearPlanning` theories. |
| **Engine aspects** | Cross-theory overlays, consistent name resolution and coherent traces across different reasoning modes. |

## Example Task

| Field | Value |
|-------|-------|
| **NL_TASK** | A robot in a warehouse must move a box of known mass from Shelf to Dock, compute the energy cost of the move and prove that the plan is valid given safety constraints. |
| **TASK_TYPE** | Plan |

### DSL_TASK

```spockdsl
@MixedSession session begin
    @useLogic local UseTheory BasicLogic
    @useNumeric local UseTheory NumericExamples
    @usePlan local UseTheory LinearPlanning

    @box Box Is Object
    @massLiteral 20 HasNumericValue 20
    @mass massLiteral AttachUnit kg
    @boxMass mass AttachToConcept box

    @start BoxAt Shelf
    @goal BoxAt Dock

    @plan start Plan goal
end
```

### DSL_OUTPUT

```spockdsl
@MixedResult session begin
    @useLogic local UseTheory BasicLogic
    @useNumeric local UseTheory NumericExamples
    @usePlan local UseTheory LinearPlanning

    @step1 BoxAt Shelf GoTo LiftZone
    @step2 step1 PickUp box
    @step3 step2 GoTo Dock
    @step4 step3 Place box

    @energyLiteral 100 HasNumericValue 100
    @energy energyLiteral AttachUnit Joule
end
```

### NL_OUTPUT

The system generates a valid plan to move the box, computes an energy estimate using numeric verbs and produces a proof that the plan respects the safety theory.

## Tasks Summary

10 tasks testing mixed reasoning scenarios across multiple theory types.
