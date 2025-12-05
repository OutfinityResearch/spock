# DS tests/planning/planner.test.js

## Overview

| Field | Value |
|-------|-------|
| **Purpose** | Unit tests for `src/planning/planner.js` - Semantic Gradient Descent planner |
| **Tests module** | `src/planning/planner.js` |
| **Test count** | 20 tests across 6 categories |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Tests FS** | FS-02 (Verb taxonomy - Plan, Solve), FS-07 (Explainability) |
| **Tests DS** | DS-Planning (Semantic Gradient Descent) |

## Test Categories

### PlannerState - State Management

| Test | Description |
|------|-------------|
| creates planner state with initial and goal | Verifies PlannerState constructor |
| distanceToGoal returns value in [0, 2] | Distance metric bounds check |
| isGoalReached returns true when distance < epsilon | Goal detection with tolerance |
| isGoalReached returns false when far from goal | Non-goal detection |

### computeGradient - Semantic Direction

| Test | Description |
|------|-------------|
| computes gradient direction towards goal | Gradient points from current to goal |
| gradient is normalized | Output is unit vector (norm = 1) |
| gradient is zero when at goal | No movement needed at goal |

### findBestAction - Action Selection

| Test | Description |
|------|-------------|
| finds action that improves distance | Selects action minimizing distance |
| returns null when no improving action | Handles local minima |

### plan - Planning Algorithm

| Test | Description |
|------|-------------|
| generates plan to reach goal | Returns plan with steps and trace |
| plan succeeds when goal is reachable | Success case with good actions |
| plan respects maxSteps limit | Termination guarantee |
| plan records trace | FS-07 traceability requirement |

### solve - Constraint Satisfaction

| Test | Description |
|------|-------------|
| solves single constraint | Finds solution satisfying constraint |
| solve reports violations when unsatisfiable | Reports conflicting constraints |

### Verb Registry - isPlanningVerb / getPlanningVerb

| Test | Description |
|------|-------------|
| recognizes Plan verb | Plan is registered as planning verb |
| recognizes Solve verb | Solve is registered as planning verb |
| rejects non-planning verbs | Add, Distance not planning verbs |
| getPlanningVerb returns function for valid verb | Function retrieval works |
| getPlanningVerb returns null for invalid verb | Graceful handling of invalid verbs |

## Key Assertions

- Vector operations use Float32Array
- Distance metric in range [0, 2] (cosine-based)
- Normalized gradients have norm ≈ 1.0
- Plan traces include step types for explainability

## Run

```bash
DEBUG=false node tests/planning/planner.test.js
```
