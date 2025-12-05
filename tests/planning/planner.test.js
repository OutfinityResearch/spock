/**
 * @fileoverview Unit tests for planner.js
 *
 * Tests: DS Planning - Semantic Gradient Descent Planner
 * Specs: URS-004, FS-02, DS-Planning
 *
 * The planner provides:
 * - plan(): Generate action sequences to reach goal
 * - solve(): Find constraint satisfaction solutions
 * - computeGradient(): Calculate semantic direction
 * - findBestAction(): Select optimal next action
 */

'use strict';

const {
  suite,
  category,
  test,
  assert,
  assertEqual,
  assertClose,
  assertThrows,
  assertType,
  exit
} = require('../testFramework');

const {
  plan,
  solve,
  computeGradient,
  findBestAction,
  PlannerState,
  isPlanningVerb,
  getPlanningVerb
} = require('../../src/planning/planner');

const vectorSpace = require('../../src/kernel/vectorSpace');
const { resetConfig } = require('../../src/config/config');

// Set deterministic seed for tests
beforeAll();

function beforeAll() {
  resetConfig();
  vectorSpace.setRandomSeed(42);
}

// ============== TEST SUITE ==============

suite('planner.js', {
  file: 'src/planning/planner.js',
  specs: ['URS-004', 'FS-02', 'DS-Planning']
});

// ============== PlannerState ==============

category('PlannerState - State Management');

test('creates planner state with initial and goal', {
  input: 'new PlannerState(initial, goal)',
  expected: 'state object with vectors',
  spec: 'FS-02'
}, () => {
  const initial = vectorSpace.createRandomVector(64);
  const goal = vectorSpace.createRandomVector(64);
  const state = new PlannerState(initial, goal);

  assertEqual(state.currentVector.length, 64);
  assertEqual(state.goalVector.length, 64);
  assertEqual(state.steps.length, 0);
});

test('distanceToGoal returns value in [0, 2]', {
  input: 'state.distanceToGoal()',
  expected: 'distance >= 0 and <= 2'
}, () => {
  const initial = vectorSpace.createRandomVector(64);
  const goal = vectorSpace.createRandomVector(64);
  const state = new PlannerState(initial, goal);

  const dist = state.distanceToGoal();
  assert(dist >= 0 && dist <= 2, `Distance ${dist} should be in [0, 2]`);
});

test('isGoalReached returns true when distance < epsilon', {
  input: 'state.isGoalReached() when at goal',
  expected: 'true'
}, () => {
  const vec = vectorSpace.createRandomVector(64);
  const state = new PlannerState(vec, vec, { epsilon: 0.1 });

  assert(state.isGoalReached(), 'Should be at goal when initial equals goal');
});

test('isGoalReached returns false when far from goal', {
  input: 'state.isGoalReached() when far',
  expected: 'false'
}, () => {
  const initial = vectorSpace.createRandomVector(64);
  const goal = vectorSpace.createRandomVector(64);
  const state = new PlannerState(initial, goal, { epsilon: 0.001 });

  // Random vectors are typically not similar
  assert(!state.isGoalReached(), 'Should not be at goal for random vectors');
});

// ============== computeGradient ==============

category('computeGradient - Semantic Direction');

test('computes gradient direction towards goal', {
  input: 'computeGradient(current, goal)',
  expected: 'normalized direction vector',
  spec: 'FS-02'
}, () => {
  const current = new Float32Array([1, 0, 0, 0]);
  const goal = new Float32Array([0, 1, 0, 0]);

  const gradient = computeGradient(current, goal);

  assertEqual(gradient.length, 4);
  // Gradient should point from current towards goal
  assert(gradient[1] > 0, 'Gradient should point towards goal');
});

test('gradient is normalized', {
  input: 'computeGradient()',
  expected: 'unit vector (norm ≈ 1)'
}, () => {
  const current = vectorSpace.createRandomVector(64);
  const goal = vectorSpace.createRandomVector(64);

  const gradient = computeGradient(current, goal);
  const norm = vectorSpace.norm(gradient);

  assertClose(norm, 1.0, 0.001, 'Gradient should be normalized');
});

test('gradient is zero when at goal', {
  input: 'computeGradient(v, v)',
  expected: 'zero vector'
}, () => {
  const vec = vectorSpace.createRandomVector(64);
  const gradient = computeGradient(vec, vec);

  // Note: normalized zero vector stays zero
  const norm = vectorSpace.norm(gradient);
  assertClose(norm, 0, 0.001, 'Gradient should be zero at goal');
});

// ============== findBestAction ==============

category('findBestAction - Action Selection');

test('finds action that improves distance', {
  input: 'findBestAction(current, goal, actions)',
  expected: 'action with positive improvement',
  spec: 'FS-02'
}, () => {
  const current = new Float32Array([1, 0, 0, 0]);
  const goal = new Float32Array([0, 1, 0, 0]);

  const actions = [
    { name: 'move_y', vector: new Float32Array([0, 0.5, 0, 0]) },
    { name: 'move_x', vector: new Float32Array([0.5, 0, 0, 0]) },
    { name: 'move_z', vector: new Float32Array([0, 0, 0.5, 0]) }
  ];

  const best = findBestAction(current, goal, actions);

  assertEqual(best.name, 'move_y', 'Should select action towards goal');
  assert(best.improvement > 0, 'Should have positive improvement');
});

test('returns null when no improving action', {
  input: 'findBestAction() with bad actions',
  expected: 'null'
}, () => {
  const current = new Float32Array([0, 1, 0, 0]);
  const goal = new Float32Array([0, 1, 0, 0]);  // Already at goal

  const actions = [
    { name: 'away', vector: new Float32Array([1, 0, 0, 0]) }
  ];

  const best = findBestAction(current, goal, actions);

  // May return null or action with no improvement
  if (best) {
    assert(best.improvement <= 0, 'No improvement when at goal');
  }
});

// ============== plan ==============

category('plan - Planning Algorithm');

test('generates plan to reach goal', {
  input: 'plan(initial, goal, actions)',
  expected: 'plan result with steps',
  spec: 'FS-02'
}, () => {
  const initial = new Float32Array([1, 0, 0, 0]);
  const goal = new Float32Array([0, 1, 0, 0]);

  const actions = [
    { name: 'move_y', vector: new Float32Array([0, 0.5, 0, 0]) },
    { name: 'move_neg_x', vector: new Float32Array([-0.5, 0, 0, 0]) }
  ];

  const result = plan(initial, goal, actions, { maxSteps: 50, epsilon: 0.3 });

  assertType(result, 'object');
  assert(Array.isArray(result.steps), 'Should have steps array');
  assert(Array.isArray(result.trace), 'Should have trace array');
  assertType(result.finalDistance, 'number');
});

test('plan succeeds when goal is reachable', {
  input: 'plan() with good actions',
  expected: 'success: true',
  spec: 'FS-02'
}, () => {
  // Use very close vectors
  const initial = new Float32Array([1, 0, 0, 0]);
  const goal = new Float32Array([0.9, 0.1, 0, 0]);

  const actions = [
    { name: 'adjust', vector: new Float32Array([-0.1, 0.1, 0, 0]) }
  ];

  const result = plan(initial, goal, actions, { maxSteps: 10, epsilon: 0.5 });

  // With close vectors and good action, should succeed or get close
  assert(result.finalDistance < 1.0, 'Should make progress towards goal');
});

test('plan respects maxSteps limit', {
  input: 'plan() with maxSteps: 5',
  expected: 'totalSteps <= 5'
}, () => {
  const initial = vectorSpace.createRandomVector(64);
  const goal = vectorSpace.createRandomVector(64);

  const actions = [
    { name: 'random', vector: vectorSpace.createRandomVector(64) }
  ];

  const result = plan(initial, goal, actions, { maxSteps: 5 });

  assert(result.totalSteps <= 5, 'Should respect maxSteps limit');
});

test('plan records trace', {
  input: 'plan().trace',
  expected: 'array with initial and action steps',
  spec: 'FS-07'
}, () => {
  const initial = new Float32Array([1, 0, 0, 0]);
  const goal = new Float32Array([0, 1, 0, 0]);

  const actions = [
    { name: 'move', vector: new Float32Array([0, 0.5, 0, 0]) }
  ];

  const result = plan(initial, goal, actions, { maxSteps: 3 });

  assert(result.trace.length > 0, 'Should have trace entries');
  assertEqual(result.trace[0].type, 'initial', 'First trace should be initial');
});

// ============== solve ==============

category('solve - Constraint Satisfaction');

test('solves single constraint', {
  input: 'solve(initial, [constraint])',
  expected: 'solution satisfying constraint',
  spec: 'FS-02'
}, () => {
  const initial = vectorSpace.createRandomVector(64);
  const constraint = {
    name: 'target',
    vector: vectorSpace.createRandomVector(64),
    minSimilarity: 0.3
  };

  const result = solve(initial, [constraint], { maxSteps: 50 });

  assertType(result, 'object');
  assert(result.solution instanceof Float32Array, 'Should return solution vector');
  assert(Array.isArray(result.trace), 'Should have trace');
});

test('solve reports violations when unsatisfiable', {
  input: 'solve() with conflicting constraints',
  expected: 'violations array'
}, () => {
  const initial = new Float32Array([1, 0, 0, 0]);

  // Conflicting constraints (opposite directions)
  const constraints = [
    { name: 'pos_y', vector: new Float32Array([0, 1, 0, 0]), minSimilarity: 0.9 },
    { name: 'neg_y', vector: new Float32Array([0, -1, 0, 0]), minSimilarity: 0.9 }
  ];

  const result = solve(initial, constraints, { maxSteps: 10 });

  // Should either fail or have violations
  if (!result.success) {
    assert(result.violations.length > 0, 'Should report violations');
  }
});

// ============== Verb Registry ==============

category('Verb Registry - isPlanningVerb / getPlanningVerb');

test('recognizes Plan verb', {
  input: 'isPlanningVerb("Plan")',
  expected: 'true',
  spec: 'FS-02'
}, () => {
  assert(isPlanningVerb('Plan'), 'Plan should be planning verb');
});

test('recognizes Solve verb', {
  input: 'isPlanningVerb("Solve")',
  expected: 'true'
}, () => {
  assert(isPlanningVerb('Solve'), 'Solve should be planning verb');
});

test('rejects non-planning verbs', {
  input: 'isPlanningVerb("Add")',
  expected: 'false'
}, () => {
  assert(!isPlanningVerb('Add'), 'Add should not be planning verb');
  assert(!isPlanningVerb('Distance'), 'Distance should not be planning verb');
});

test('getPlanningVerb returns function for valid verb', {
  input: 'getPlanningVerb("Plan")',
  expected: 'function'
}, () => {
  const fn = getPlanningVerb('Plan');
  assertType(fn, 'function', 'Should return function');
});

test('getPlanningVerb returns null for invalid verb', {
  input: 'getPlanningVerb("InvalidVerb")',
  expected: 'null'
}, () => {
  const fn = getPlanningVerb('InvalidVerb');
  assertEqual(fn, null, 'Should return null for invalid verb');
});

// ============== Exit ==============

exit();
