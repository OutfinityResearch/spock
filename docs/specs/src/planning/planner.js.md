# DS src/planning/planner.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Implement the `Plan` and `Solve` verbs using Semantic Gradient Descent - geometric navigation through conceptual space toward goal states. |
| **Public functions** | `plan(initialState, goalState, candidateActions, options)`, `solve(initialState, constraints, options)`, `isPlanningVerb(verbName)`, `getPlanningVerb(verbName)`, `executePlanVerb(subject, object, context)`, `executeSolveVerb(subject, object, context)` |
| **Depends on** | `src/kernel/vectorSpace.js`, `src/kernel/primitiveOps.js`, `src/config/config.js` |
| **Used by** | `src/dsl/executor.js` (verb dispatch), `src/api/sessionApi.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-004 DSL requirements (planning verbs) |
| **Implements FS** | FS-02 Verb taxonomy (Plan, Solve), FS-07 Explainability |
| **Implements DS** | DS Planning module |

## Algorithm: Semantic Gradient Descent

The planner navigates the conceptual space by choosing actions that minimize angular distance to the goal.

### Core Loop

```javascript
function plan(initialState, goalState, candidateActions, options = {}) {
  const state = new PlannerState(initialState, goalState, options);
  const trace = [];
  let stepNum = 0;

  while (!state.isGoalReached() && stepNum < state.maxSteps) {
    stepNum++;

    // Find best action
    const bestAction = findBestAction(state.currentVector, state.goalVector, candidateActions);

    if (!bestAction || bestAction.improvement <= 0) {
      // Handle plateau based on strategy
      if (state.plateauStrategy === 'fail') break;
      if (state.plateauStrategy === 'random_restart') {
        // Add small random perturbation
        continue;
      }
      break;
    }

    // Apply action
    state.currentVector = vectorSpace.addVectors(state.currentVector, bestAction.vector);
    state.currentVector = vectorSpace.normalise(state.currentVector);
    state.recordStep({ step: stepNum, action: bestAction.name, ... });
  }

  return {
    success: state.isGoalReached(),
    steps: state.steps,
    trace,
    finalDistance: state.distanceToGoal(),
    totalSteps: stepNum
  };
}
```

### Candidate Generation

```javascript
function generateCandidates(state, context) {
  const candidates = [];
  const availableVerbs = getAvailableVerbs(context);
  const availableObjects = getAvailableObjects(context);

  for (const verb of availableVerbs) {
    for (const obj of availableObjects) {
      try {
        const nextState = applyVerb(verb, state, obj, context);
        candidates.push({
          action: { verb: verb.name, object: obj.name },
          nextState,
          distance: null  // Computed in selectBest
        });
      } catch (e) {
        // Skip invalid combinations
      }
    }
  }

  return candidates;
}
```

### Selection

```javascript
function selectBest(candidates, goalState) {
  let best = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    candidate.distance = primitiveOps.distance(candidate.nextState, goalState);
    if (candidate.distance < bestDistance) {
      bestDistance = candidate.distance;
      best = candidate;
    }
  }

  return best;
}
```

## Plateau Handling

When the algorithm reaches a plateau (no action improves the score), it has several options:

| Strategy | Description |
|----------|-------------|
| `fail` | Return failure immediately |
| `random_restart` | Try a random action and continue |
| `procedural_fallback` | Invoke external JS solver plugin |

```javascript
function handlePlateau(current, goal, planSoFar, context) {
  const strategy = context.config.plateauStrategy || 'fail';

  switch (strategy) {
    case 'fail':
      return { success: false, reason: 'plateau', plan: planSoFar };

    case 'random_restart':
      // Pick random action, hope it escapes plateau
      const randomAction = pickRandom(generateCandidates(current, context));
      return continueFromState(randomAction.nextState, goal, [...planSoFar, randomAction.action], context);

    case 'procedural_fallback':
      // Invoke external solver if registered
      if (context.proceduralSolver) {
        return context.proceduralSolver(current, goal, planSoFar);
      }
      return { success: false, reason: 'no_procedural_solver' };
  }
}
```

## Solve Algorithm

`Solve` finds a point satisfying constraints through iterative projection:

```javascript
function solve(initialState, constraints, options = {}) {
  let current = vectorSpace.cloneVector(initialState);
  const epsilon = options.epsilon || config.planningEpsilon;
  const maxSteps = options.maxSteps || config.maxPlanningSteps;
  let stepNum = 0;

  // Iteratively project onto each constraint
  while (stepNum < maxSteps) {
    stepNum++;
    let anyAdjustment = false;

    for (const constraint of constraints) {
      const similarity = vectorSpace.cosineSimilarity(current, constraint.vector);
      const violation = constraint.minSimilarity - similarity;

      if (violation > epsilon) {
        anyAdjustment = true;
        const adjustment = vectorSpace.scale(constraint.vector, violation * 0.5);
        current = vectorSpace.addVectors(current, adjustment);
        current = vectorSpace.normalise(current);
      }
    }

    if (!anyAdjustment) break;  // All constraints satisfied
  }

  return {
    success: allConstraintsSatisfied,
    solution: current,
    trace,
    violations: finalViolations,
    totalSteps: stepNum
  };
}
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `planningEpsilon` | 0.05 | Distance threshold for goal reached |
| `maxPlanningSteps` | 100 | Maximum iterations before timeout |
| `plateauStrategy` | 'fail' | How to handle plateaus |
| `candidateLimit` | 1000 | Max candidates per step (for performance) |

## Trace Output

Planning produces a trace compatible with the DSL output format:

```javascript
{
  success: true,
  plan: [
    { verb: 'GoTo', object: 'Kitchen', dsl: '@step1 start GoTo Kitchen' },
    { verb: 'PickUp', object: 'Cup', dsl: '@step2 step1 PickUp Cup' },
    // ...
  ],
  finalState: Float32Array([...]),
  stepsCount: 4,
  finalDistance: 0.02
}
```

## Integration with Executor

The executor dispatches `Plan` and `Solve` verbs to this module via the verb registry:

```javascript
const PLANNING_VERBS = {
  'Plan': executePlanVerb,
  'Solve': executeSolveVerb
};

function isPlanningVerb(verbName) {
  return verbName in PLANNING_VERBS;
}

function getPlanningVerb(verbName) {
  return PLANNING_VERBS[verbName] || null;
}

// executePlanVerb extracts candidate actions from session, calls plan()
// executeSolveVerb converts object to constraints, calls solve()
```
