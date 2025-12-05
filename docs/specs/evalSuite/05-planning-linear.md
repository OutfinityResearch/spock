# DS evalSuite/05-planning-linear/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 05-planning-linear |
| **Goal** | Test linear planning: a sequence of actions transforming an initial state into a simple goal state. |
| **Theory focus** | A `LinearPlanning` theory that defines actions like `GoTo`, `PickUp`, `Place` and a `Plan` verb. |
| **Engine aspects** | Search over a small state space, representation of plans as sequences, proof-like trajectories. |

## Example Task

| Field | Value |
|-------|-------|
| **NL_TASK** | From "Robot at Home, Cup at Kitchen, Goal: Cup at Table", find a simple plan that moves the robot and the cup so that the cup ends up on the table. |
| **TASK_TYPE** | Plan |

### DSL_OUTPUT (excerpt)

```spockdsl
@PlanningResult session begin
    @step1 start GoTo Kitchen
    @step2 step1 PickUp Cup
    @step3 step2 GoTo Table
    @step4 step3 Place Cup

    @finalState CupAt Table
end
```

### NL_OUTPUT

The system produces a plan [GoTo(Kitchen), PickUp(Cup), GoTo(Table), Place(Cup)] that transforms the initial state into the goal state.

## Tasks Summary

10 tasks testing linear planning with increasing complexity.
