# DS src/planning/planner.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Implement the `Plan` and `Solve` verbs using Semantic Gradient Descent - geometric navigation through conceptual space toward goal states. |
| **Public functions** | `plan(currentState, goalState, context)`, `solve(constraints, context)` |
| **Depends on** | `src/kernel/primitiveOps.js`, `src/dsl/executor.js`, `src/session/sessionManager.js` |
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
function plan(currentState, goalState, context) {
  const plan = [];
  let current = currentState;
  const epsilon = context.config.planningEpsilon || 0.05;
  const maxSteps = context.config.maxPlanningSteps || 100;

  for (let step = 0; step < maxSteps; step++) {
    const currentDistance = primitiveOps.distance(current, goalState);

    if (currentDistance < epsilon) {
      return { success: true, plan, finalState: current };
    }

    const candidates = generateCandidates(current, context);
    const best = selectBest(candidates, goalState);

    if (!best || best.distance >= currentDistance) {
      // Plateau - no improvement possible
      return handlePlateau(current, goalState, plan, context);
    }

    plan.push(best.action);
    current = best.nextState;
  }

  return { success: false, reason: 'max_steps_exceeded', plan };
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

`Solve` finds a point (assignment) rather than a trajectory:

```javascript
function solve(constraints, context) {
  // Constraints are vectors representing desired properties
  // Goal is to find a state that minimizes total distance to all constraints

  const goalVector = combineConstraints(constraints);
  return plan(context.currentState, goalVector, context);
}

function combineConstraints(constraints) {
  // Sum and normalize - find the "consensus" point
  let combined = createZeroVector();
  for (const constraint of constraints) {
    combined = primitiveOps.add(combined, constraint.vector);
  }
  return primitiveOps.normalise(combined);
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

The executor dispatches `Plan` and `Solve` verbs to this module:

```javascript
// In executor.js verb dispatch
case 'Plan':
  return planner.plan(subjectValue, objectValue, context);
case 'Solve':
  return planner.solve(subjectValue, context);
```
