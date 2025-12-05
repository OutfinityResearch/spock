/**
 * @fileoverview Unit tests for sessionManager.js
 */

'use strict';

const {
  createSession,
  getSymbol,
  setSymbol,
  hasSymbol,
  overlayTheory,
  popOverlay,
  getLocalSymbolNames,
  getAllSymbolNames,
  clearLocalSymbols,
  createChildSession,
  createTypedValue,
  getSessionStats
} = require('../../src/session/sessionManager');
const { resetConfig } = require('../../src/config/config');
const vectorSpace = require('../../src/kernel/vectorSpace');

// Test helpers
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Track results
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    resetConfig();
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

// Helper to create test globals
function createTestGlobals() {
  const globals = new Map();
  vectorSpace.setRandomSeed(42);
  const Truth = vectorSpace.normalise(vectorSpace.createRandomVector(512));
  globals.set('Truth', createTypedValue('VECTOR', Truth));
  globals.set('False', createTypedValue('VECTOR', vectorSpace.scale(Truth, -1)));
  globals.set('Zero', createTypedValue('VECTOR', vectorSpace.createVector(512)));
  return globals;
}

// ============== TESTS ==============

console.log('\nsessionManager.js');

// createSession tests
test('createSession: creates session with id', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  assert(session.id !== undefined, 'Should have id');
  assert(typeof session.id === 'string', 'ID should be string');
});

test('createSession: has empty local symbols', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  assertEqual(session.localSymbols.size, 0);
});

test('createSession: has global reference', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  assert(session.globals === globals, 'Should reference globals');
});

test('createSession: starts with empty overlays', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  assertEqual(session.overlays.length, 0);
});

// createTypedValue tests
test('createTypedValue: creates VECTOR type', () => {
  const vec = new Float32Array([1, 2, 3]);
  const tv = createTypedValue('VECTOR', vec);
  assertEqual(tv.type, 'VECTOR');
  assertEqual(tv.value, vec);
});

test('createTypedValue: creates SCALAR type', () => {
  const tv = createTypedValue('SCALAR', 0.5);
  assertEqual(tv.type, 'SCALAR');
  assertEqual(tv.value, 0.5);
});

test('createTypedValue: creates NUMERIC type', () => {
  const tv = createTypedValue('NUMERIC', 42);
  assertEqual(tv.type, 'NUMERIC');
  assertEqual(tv.value, 42);
});

test('createTypedValue: accepts extra properties', () => {
  const tv = createTypedValue('NUMERIC', 42, { unit: 'kg' });
  assertEqual(tv.unit, 'kg');
});

// setSymbol / getSymbol tests
test('setSymbol: stores symbol in local', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const vec = vectorSpace.createRandomVector(512);
  const tv = createTypedValue('VECTOR', vec);

  setSymbol(session, '@test', tv);
  assert(session.localSymbols.has('@test'));
});

test('getSymbol: retrieves local symbol', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const tv = createTypedValue('SCALAR', 123);

  setSymbol(session, '@myScalar', tv);
  const retrieved = getSymbol(session, '@myScalar');

  assertEqual(retrieved.type, 'SCALAR');
  assertEqual(retrieved.value, 123);
});

test('getSymbol: retrieves global symbol', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  const truth = getSymbol(session, 'Truth');
  assertEqual(truth.type, 'VECTOR');
});

test('getSymbol: returns undefined for missing', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  const missing = getSymbol(session, '@nonexistent');
  assertEqual(missing, undefined);
});

test('getSymbol: local shadows global', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  // Set local Truth that shadows global
  const localTruth = createTypedValue('SCALAR', 999);
  setSymbol(session, 'Truth', localTruth);

  const retrieved = getSymbol(session, 'Truth');
  assertEqual(retrieved.type, 'SCALAR', 'Local should shadow global');
  assertEqual(retrieved.value, 999);
});

// hasSymbol tests
test('hasSymbol: returns true for local', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  setSymbol(session, '@exists', createTypedValue('SCALAR', 1));
  assert(hasSymbol(session, '@exists'));
});

test('hasSymbol: returns true for global', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  assert(hasSymbol(session, 'Truth'));
  assert(hasSymbol(session, 'False'));
  assert(hasSymbol(session, 'Zero'));
});

test('hasSymbol: returns false for missing', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  assert(!hasSymbol(session, '@missing'));
});

// overlayTheory tests
test('overlayTheory: adds to overlays', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  const theory = { name: 'TestTheory', symbols: new Map() };
  overlayTheory(session, theory);

  assertEqual(session.overlays.length, 1);
});

test('overlayTheory: symbol resolution checks overlay', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  const theorySymbols = new Map();
  theorySymbols.set('@theoryFact', createTypedValue('SCALAR', 42));

  const theory = { name: 'TestTheory', symbols: theorySymbols };
  overlayTheory(session, theory);

  const retrieved = getSymbol(session, '@theoryFact');
  assertEqual(retrieved.value, 42);
});

test('overlayTheory: LIFO order (latest wins)', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  const theory1Symbols = new Map();
  theory1Symbols.set('@shared', createTypedValue('SCALAR', 1));
  const theory1 = { name: 'Theory1', symbols: theory1Symbols };

  const theory2Symbols = new Map();
  theory2Symbols.set('@shared', createTypedValue('SCALAR', 2));
  const theory2 = { name: 'Theory2', symbols: theory2Symbols };

  overlayTheory(session, theory1);
  overlayTheory(session, theory2);

  const retrieved = getSymbol(session, '@shared');
  assertEqual(retrieved.value, 2, 'Latest overlay should win');
});

// popOverlay tests
test('popOverlay: removes last overlay', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  const theory = { name: 'Test', symbols: new Map() };
  overlayTheory(session, theory);
  assertEqual(session.overlays.length, 1);

  popOverlay(session);
  assertEqual(session.overlays.length, 0);
});

test('popOverlay: symbols no longer visible', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  const theorySymbols = new Map();
  theorySymbols.set('@temp', createTypedValue('SCALAR', 99));
  overlayTheory(session, { name: 'Temp', symbols: theorySymbols });

  assert(hasSymbol(session, '@temp'), 'Should be visible with overlay');

  popOverlay(session);

  assert(!hasSymbol(session, '@temp'), 'Should not be visible after pop');
});

// getLocalSymbolNames tests
test('getLocalSymbolNames: returns local names', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  setSymbol(session, '@a', createTypedValue('SCALAR', 1));
  setSymbol(session, '@b', createTypedValue('SCALAR', 2));

  const names = getLocalSymbolNames(session);
  assert(names.includes('@a'));
  assert(names.includes('@b'));
  assertEqual(names.length, 2);
});

// getAllSymbolNames tests
test('getAllSymbolNames: includes locals and globals', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  setSymbol(session, '@local', createTypedValue('SCALAR', 1));

  const names = getAllSymbolNames(session);
  assert(names.includes('@local'), 'Should include local');
  assert(names.includes('Truth'), 'Should include global');
});

test('getAllSymbolNames: includes overlay symbols', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  const theorySymbols = new Map();
  theorySymbols.set('@fromTheory', createTypedValue('SCALAR', 1));
  overlayTheory(session, { name: 'Test', symbols: theorySymbols });

  const names = getAllSymbolNames(session);
  assert(names.includes('@fromTheory'));
});

// clearLocalSymbols tests
test('clearLocalSymbols: removes all locals', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  setSymbol(session, '@a', createTypedValue('SCALAR', 1));
  setSymbol(session, '@b', createTypedValue('SCALAR', 2));

  clearLocalSymbols(session);

  assertEqual(session.localSymbols.size, 0);
});

test('clearLocalSymbols: preserves globals', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  setSymbol(session, '@local', createTypedValue('SCALAR', 1));
  clearLocalSymbols(session);

  assert(hasSymbol(session, 'Truth'), 'Globals should remain');
});

// createChildSession tests
test('createChildSession: creates new session', () => {
  const globals = createTestGlobals();
  const parent = createSession([], globals);
  const child = createChildSession(parent);

  assert(child.id !== parent.id, 'Should have different ID');
});

test('createChildSession: inherits globals', () => {
  const globals = createTestGlobals();
  const parent = createSession([], globals);
  const child = createChildSession(parent);

  assert(hasSymbol(child, 'Truth'), 'Child should see globals');
});

test('createChildSession: sees parent symbols as overlay', () => {
  const globals = createTestGlobals();
  const parent = createSession([], globals);

  setSymbol(parent, '@parentFact', createTypedValue('SCALAR', 42));

  const child = createChildSession(parent);

  assert(hasSymbol(child, '@parentFact'), 'Child should see parent symbol');
});

test('createChildSession: child changes dont affect parent', () => {
  const globals = createTestGlobals();
  const parent = createSession([], globals);
  const child = createChildSession(parent);

  setSymbol(child, '@childOnly', createTypedValue('SCALAR', 99));

  assert(!hasSymbol(parent, '@childOnly'), 'Parent should not see child symbol');
});

// getSessionStats tests
test('getSessionStats: returns stats object', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  setSymbol(session, '@a', createTypedValue('SCALAR', 1));
  setSymbol(session, '@b', createTypedValue('SCALAR', 2));

  const stats = getSessionStats(session);

  assert(stats.symbolCount !== undefined);
  assert(stats.overlayCount !== undefined);
});

test('getSessionStats: counts symbols correctly', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);

  setSymbol(session, '@x', createTypedValue('SCALAR', 1));
  setSymbol(session, '@y', createTypedValue('SCALAR', 2));
  setSymbol(session, '@z', createTypedValue('SCALAR', 3));

  const stats = getSessionStats(session);
  assertEqual(stats.symbolCount, 3);
});

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`sessionManager.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
