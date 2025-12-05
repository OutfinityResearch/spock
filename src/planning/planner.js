/**
 * @fileoverview Semantic Gradient Descent Planner
 * @implements URS-004, FS-02, FS-07, DS Planning
 *
 * Implements the Plan and Solve verbs using Semantic Gradient Descent:
 * - Plan: Generate action sequences from initial to goal state
 * - Solve: Find constraint solutions through vector optimization
 *
 * Algorithm (per FS-02):
 * 1. Start with initial state vector
 * 2. Compute gradient towards goal (cosine similarity direction)
 * 3. Apply action verbs that move state closer to goal
 * 4. Repeat until distance < epsilon or plateau detected
 */

'use strict';

const vectorSpace = require('../kernel/vectorSpace');
const { executeKernelVerb } = require('../kernel/primitiveOps');
const { getConfig } = require('../config/config');
const debug = require('../logging/debugLogger').kernel;

/**
 * Planner state for tracking progress
 */
class PlannerState {
  constructor(initialVector, goalVector, options = {}) {
    const config = getConfig();

    this.currentVector = vectorSpace.cloneVector(initialVector);
    this.goalVector = goalVector;
    this.epsilon = options.epsilon || config.planningEpsilon;
    this.maxSteps = options.maxSteps || config.maxPlanningSteps;
    this.plateauStrategy = options.plateauStrategy || config.plateauStrategy;

    this.steps = [];
    this.distances = [];
    this.plateauCount = 0;
    this.maxPlateauSteps = 3;
  }

  /**
   * Computes current distance to goal (1 - similarity, so lower is better)
   * @returns {number} Distance in [0, 2]
   */
  distanceToGoal() {
    const similarity = vectorSpace.cosineSimilarity(this.currentVector, this.goalVector);
    return 1 - similarity;  // Convert to distance
  }

  /**
   * Checks if goal is reached
   * @returns {boolean}
   */
  isGoalReached() {
    return this.distanceToGoal() < this.epsilon;
  }

  /**
   * Checks for plateau (no improvement)
   * @returns {boolean}
   */
  isPlateaued() {
    if (this.distances.length < 2) return false;

    const current = this.distances[this.distances.length - 1];
    const previous = this.distances[this.distances.length - 2];

    // Check if improvement is negligible
    if (Math.abs(current - previous) < this.epsilon / 10) {
      this.plateauCount++;
      return this.plateauCount >= this.maxPlateauSteps;
    }

    this.plateauCount = 0;
    return false;
  }

  /**
   * Records a step
   * @param {Object} step - Step info
   */
  recordStep(step) {
    this.steps.push(step);
    this.distances.push(this.distanceToGoal());
  }
}

/**
 * Computes the semantic gradient direction
 * @param {Float32Array} current - Current state
 * @param {Float32Array} goal - Goal state
 * @returns {Float32Array} Gradient direction (normalized)
 */
function computeGradient(current, goal) {
  debug.enter('planner', 'computeGradient', { current, goal });

  // Gradient direction: goal - current (move towards goal)
  const gradient = vectorSpace.createVector(current.length);
  for (let i = 0; i < current.length; i++) {
    gradient[i] = goal[i] - current[i];
  }

  // Normalize to unit vector
  const result = vectorSpace.normalise(gradient);

  debug.exit('planner', 'computeGradient', result);
  return result;
}

/**
 * Finds the best action to apply
 * @param {Float32Array} current - Current state
 * @param {Float32Array} goal - Goal state
 * @param {Array} candidateActions - Available action vectors
 * @returns {Object|null} Best action {index, vector, improvement}
 */
function findBestAction(current, goal, candidateActions) {
  debug.enter('planner', 'findBestAction', { candidateCount: candidateActions.length });

  const currentDistance = 1 - vectorSpace.cosineSimilarity(current, goal);
  let bestAction = null;
  let bestImprovement = 0;

  for (let i = 0; i < candidateActions.length; i++) {
    const action = candidateActions[i];

    // Simulate applying action: current + action
    const newState = vectorSpace.addVectors(current, action.vector);
    const newNormalized = vectorSpace.normalise(newState);
    const newDistance = 1 - vectorSpace.cosineSimilarity(newNormalized, goal);

    const improvement = currentDistance - newDistance;

    if (improvement > bestImprovement) {
      bestImprovement = improvement;
      bestAction = {
        index: i,
        name: action.name,
        vector: action.vector,
        improvement,
        newDistance
      };
    }
  }

  debug.step('planner', `Best action: ${bestAction?.name || 'none'}, improvement: ${bestImprovement.toFixed(6)}`);
  debug.exit('planner', 'findBestAction', bestAction);
  return bestAction;
}

/**
 * Generates a plan from initial state to goal
 *
 * @param {Float32Array} initialState - Starting state vector
 * @param {Float32Array} goalState - Target state vector
 * @param {Array} candidateActions - Available actions [{name, vector}, ...]
 * @param {Object} options - Planning options
 * @returns {Object} Plan result {success, steps, trace, finalDistance}
 */
function plan(initialState, goalState, candidateActions, options = {}) {
  debug.enter('planner', 'plan', {
    initialState,
    goalState,
    candidateCount: candidateActions.length
  });

  const state = new PlannerState(initialState, goalState, options);
  const trace = [];

  // Record initial state
  trace.push({
    step: 0,
    type: 'initial',
    distance: state.distanceToGoal(),
    vector: vectorSpace.cloneVector(state.currentVector)
  });

  let stepNum = 0;

  while (!state.isGoalReached() && stepNum < state.maxSteps) {
    stepNum++;

    // Find best action
    const bestAction = findBestAction(state.currentVector, state.goalVector, candidateActions);

    if (!bestAction || bestAction.improvement <= 0) {
      // No improving action found
      debug.step('planner', 'No improving action found');

      if (state.plateauStrategy === 'fail') {
        trace.push({
          step: stepNum,
          type: 'plateau',
          distance: state.distanceToGoal(),
          reason: 'No improving action available'
        });
        break;
      }

      if (state.plateauStrategy === 'random_restart') {
        // Add small random perturbation
        const perturbation = vectorSpace.createRandomVector(state.currentVector.length);
        const scaled = vectorSpace.scale(perturbation, 0.1);
        state.currentVector = vectorSpace.addVectors(state.currentVector, scaled);
        state.currentVector = vectorSpace.normalise(state.currentVector);

        trace.push({
          step: stepNum,
          type: 'random_restart',
          distance: state.distanceToGoal()
        });
        continue;
      }

      // procedural_fallback: just stop
      break;
    }

    // Apply action
    state.currentVector = vectorSpace.addVectors(state.currentVector, bestAction.vector);
    state.currentVector = vectorSpace.normalise(state.currentVector);

    const planStep = {
      step: stepNum,
      type: 'action',
      action: bestAction.name,
      improvement: bestAction.improvement,
      distance: state.distanceToGoal()
    };

    state.recordStep(planStep);
    trace.push(planStep);

    // Check for plateau
    if (state.isPlateaued()) {
      debug.step('planner', 'Plateau detected');

      if (state.plateauStrategy === 'fail') {
        trace.push({
          step: stepNum + 1,
          type: 'plateau',
          distance: state.distanceToGoal(),
          reason: 'No progress after multiple steps'
        });
        break;
      }
    }
  }

  const success = state.isGoalReached();
  const finalDistance = state.distanceToGoal();

  debug.step('planner', `Plan complete: success=${success}, steps=${stepNum}, finalDistance=${finalDistance.toFixed(6)}`);
  debug.exit('planner', 'plan', { success, stepCount: state.steps.length });

  return {
    success,
    steps: state.steps,
    trace,
    finalDistance,
    goalReached: success,
    totalSteps: stepNum
  };
}

/**
 * Solves a constraint satisfaction problem
 *
 * @param {Float32Array} initialState - Starting state
 * @param {Array} constraints - Constraint vectors to satisfy
 * @param {Object} options - Solver options
 * @returns {Object} Solution result
 */
function solve(initialState, constraints, options = {}) {
  debug.enter('planner', 'solve', {
    initialState,
    constraintCount: constraints.length
  });

  const config = getConfig();
  const epsilon = options.epsilon || config.planningEpsilon;
  const maxSteps = options.maxSteps || config.maxPlanningSteps;

  let current = vectorSpace.cloneVector(initialState);
  const trace = [];
  let stepNum = 0;

  // Iteratively project onto each constraint
  while (stepNum < maxSteps) {
    stepNum++;
    let totalViolation = 0;
    let anyAdjustment = false;

    for (let i = 0; i < constraints.length; i++) {
      const constraint = constraints[i];
      const similarity = vectorSpace.cosineSimilarity(current, constraint.vector);

      // Check if constraint is violated
      const violation = constraint.minSimilarity - similarity;

      if (violation > epsilon) {
        totalViolation += violation;
        anyAdjustment = true;

        // Move towards constraint
        const adjustment = vectorSpace.scale(constraint.vector, violation * 0.5);
        current = vectorSpace.addVectors(current, adjustment);
        current = vectorSpace.normalise(current);

        trace.push({
          step: stepNum,
          constraint: constraint.name || `constraint_${i}`,
          violation,
          similarity
        });
      }
    }

    if (!anyAdjustment) {
      // All constraints satisfied
      debug.step('planner', 'All constraints satisfied');
      break;
    }

    if (totalViolation < epsilon) {
      debug.step('planner', 'Total violation below epsilon');
      break;
    }
  }

  // Check final satisfaction
  let allSatisfied = true;
  const finalViolations = [];

  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i];
    const similarity = vectorSpace.cosineSimilarity(current, constraint.vector);
    const violation = constraint.minSimilarity - similarity;

    if (violation > epsilon) {
      allSatisfied = false;
      finalViolations.push({
        constraint: constraint.name || `constraint_${i}`,
        violation,
        similarity
      });
    }
  }

  debug.exit('planner', 'solve', { success: allSatisfied, steps: stepNum });

  return {
    success: allSatisfied,
    solution: current,
    trace,
    violations: finalViolations,
    totalSteps: stepNum
  };
}

/**
 * Generates candidate actions from session symbols
 * @param {Object} session - Session with symbols
 * @returns {Array} Candidate actions
 */
function extractCandidateActions(session) {
  const candidates = [];
  const config = getConfig();

  for (const [name, value] of session.localSymbols) {
    // Skip internal symbols
    if (name.startsWith('@') || name.startsWith('_')) continue;

    // Include vectors as potential actions
    if (value.type === 'VECTOR') {
      candidates.push({
        name,
        vector: value.value
      });
    }

    // Limit candidates
    if (candidates.length >= config.candidateLimit) break;
  }

  // Also check theory overlays
  for (const overlay of session.overlays || []) {
    for (const [name, value] of overlay.symbols || new Map()) {
      if (name.startsWith('@') || name.startsWith('_')) continue;

      if (value.type === 'VECTOR') {
        candidates.push({
          name: `${overlay.name}::${name}`,
          vector: value.value
        });
      }

      if (candidates.length >= config.candidateLimit) break;
    }
  }

  return candidates;
}

/**
 * Plan verb implementation for executor
 * @param {Object} subject - Initial state (VECTOR)
 * @param {Object} object - Goal state (VECTOR)
 * @param {Object} context - Execution context
 * @returns {Object} Plan result
 */
function executePlanVerb(subject, object, context) {
  debug.enter('planner', 'executePlanVerb', { subject, object });

  // Extract vectors
  const initialState = subject.type === 'VECTOR' ? subject.value : subject;
  const goalState = object.type === 'VECTOR' ? object.value : object;

  // Get candidate actions from context
  const candidates = extractCandidateActions(context.session);

  // Run planner
  const result = plan(initialState, goalState, candidates, {
    epsilon: context.config?.planningEpsilon,
    maxSteps: context.config?.maxPlanningSteps,
    plateauStrategy: context.config?.plateauStrategy
  });

  debug.exit('planner', 'executePlanVerb', result);

  // Return as typed value with plan steps
  return {
    type: 'PLAN',
    success: result.success,
    steps: result.steps,
    trace: result.trace,
    finalDistance: result.finalDistance
  };
}

/**
 * Solve verb implementation for executor
 * @param {Object} subject - Initial state (VECTOR)
 * @param {Object} object - Constraints (VECTOR or array)
 * @param {Object} context - Execution context
 * @returns {Object} Solution result
 */
function executeSolveVerb(subject, object, context) {
  debug.enter('planner', 'executeSolveVerb', { subject, object });

  const initialState = subject.type === 'VECTOR' ? subject.value : subject;

  // Convert object to constraints
  let constraints = [];
  if (Array.isArray(object)) {
    constraints = object.map((c, i) => ({
      name: c.name || `constraint_${i}`,
      vector: c.type === 'VECTOR' ? c.value : c,
      minSimilarity: c.minSimilarity || 0.5
    }));
  } else if (object.type === 'VECTOR') {
    constraints = [{
      name: 'goal',
      vector: object.value,
      minSimilarity: 0.8
    }];
  }

  const result = solve(initialState, constraints, {
    epsilon: context.config?.planningEpsilon,
    maxSteps: context.config?.maxPlanningSteps
  });

  debug.exit('planner', 'executeSolveVerb', result);

  return {
    type: 'SOLUTION',
    success: result.success,
    value: result.solution,
    trace: result.trace,
    violations: result.violations
  };
}

/**
 * Planning verb registry
 */
const PLANNING_VERBS = {
  'Plan': executePlanVerb,
  'Solve': executeSolveVerb
};

/**
 * Checks if a verb is a planning verb
 * @param {string} verbName - Verb name
 * @returns {boolean}
 */
function isPlanningVerb(verbName) {
  return verbName in PLANNING_VERBS;
}

/**
 * Gets a planning verb implementation
 * @param {string} verbName - Verb name
 * @returns {function|null}
 */
function getPlanningVerb(verbName) {
  return PLANNING_VERBS[verbName] || null;
}

module.exports = {
  plan,
  solve,
  computeGradient,
  findBestAction,
  extractCandidateActions,
  executePlanVerb,
  executeSolveVerb,
  isPlanningVerb,
  getPlanningVerb,
  PlannerState,
  PLANNING_VERBS
};
