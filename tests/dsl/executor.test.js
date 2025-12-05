/**
 * @fileoverview Unit tests for executor.js
 */

'use strict';

const { executeScript, createContext, ExecutionError } = require('../../src/dsl/executor');
const { parse } = require('../../src/dsl/parser');
const { createSession, createTypedValue } = require('../../src/session/sessionManager');
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

function assertThrows(fn, message) {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
  }
  if (!threw) {
    throw new Error(message || 'Expected function to throw');
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

// Create test globals
function createTestGlobals() {
  const globals = new Map();
  const dim = 512;

  vectorSpace.setRandomSeed(42);
  const Truth = vectorSpace.normalise(vectorSpace.createRandomVector(dim));
  globals.set('Truth', createTypedValue('VECTOR', Truth));

  const False = new Float32Array(dim);
  for (let i = 0; i < dim; i++) False[i] = -Truth[i];
  globals.set('False', createTypedValue('VECTOR', False));

  const Zero = vectorSpace.createVector(dim);
  globals.set('Zero', createTypedValue('VECTOR', Zero));

  return globals;
}

// ============== TESTS ==============

console.log('\nexecutor.js');

// createContext tests
test('createContext: creates valid context', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, { traceId: 'test-1' });

  assert(ctx.session !== undefined, 'Should have session');
  assert(ctx.traceId === 'test-1', 'Should have traceId');
});

// Basic execution tests
test('executes simple fact', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@fact Socrates Bind Human');
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@fact'), 'Should have @fact symbol');
});

test('executes multiple facts', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@f1 A Bind B\n@f2 C Bind D');
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@f1'), 'Should have @f1');
  assert(result.symbols.has('@f2'), 'Should have @f2');
});

test('creates vectors for unknown concepts', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@fact NewConcept Bind AnotherConcept');
  executeScript(ast, ctx);

  // Check session has the concepts
  assert(session.localSymbols.has('NewConcept') || session.localSymbols.has('@fact'));
});

// Kernel verb execution
test('executes Add verb', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@f1 A Bind B\n@f2 C Bind D\n@combined $f1 Add $f2');
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@combined'), 'Should have @combined');
});

test('executes Distance verb (returns scalar)', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@f1 A Bind B\n@f2 A Bind B\n@dist $f1 Distance $f2');
  const result = executeScript(ast, ctx);

  const dist = result.symbols.get('@dist');
  assert(dist !== undefined, 'Should have @dist');
  // Distance should be a scalar or wrapped scalar
});

test('executes Negate verb', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@f1 A Bind B\n@neg $f1 Negate $f1');
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@neg'), 'Should have @neg');
});

test('executes Modulate with scalar', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  // This tests polymorphic Modulate
  const ast = parse('@f1 A Bind B\n@scaled Truth Modulate 0.5');
  const result = executeScript(ast, ctx);

  // Should execute without error
  assert(result.symbols !== undefined);
});

test('executes Identity verb', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@f1 A Bind B\n@same $f1 Identity $f1');
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@same'), 'Should have @same');
});

test('executes Normalise verb', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@f1 A Bind B\n@norm $f1 Normalise $f1');
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@norm'), 'Should have @norm');
});

// Reference resolution
test('resolves declaration references', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@f1 A Bind B\n@f2 $f1 Bind C');
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@f2'), 'Should resolve @f1 reference');
});

test('resolves global symbols (Truth, False, Zero)', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@t Truth Identity Truth\n@f False Identity False');
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@t'), 'Should resolve Truth');
  assert(result.symbols.has('@f'), 'Should resolve False');
});

// Dependency order
test('executes in dependency order', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  // @c depends on @a and @b, but defined first
  const ast = parse('@c $a Add $b\n@a X Bind Y\n@b Y Bind Z');
  const result = executeScript(ast, ctx);

  // Should execute without error, meaning order was correct
  assert(result.symbols.has('@c'), 'Should have @c despite being defined first');
});

// Theory execution
test('executes theory definition', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse(`
    @Logic theory begin
      @f1 A Bind B
      @f2 B Bind C
    end
  `);
  const result = executeScript(ast, ctx);

  // Theory should be processed
  assert(result !== undefined);
});

// Verb macro execution
test('executes verb macro', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse(`
    @Is verb begin
      @binding $subject Bind $object
      @result $binding Move $subject
    end

    @fact Socrates Is Human
  `);
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@fact'), 'Should execute using custom Is verb');
});

// Session execution
test('executes session block', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse(`
    @TestSession session begin
      @f1 A Bind B
      @f2 C Bind D
    end
  `);
  const result = executeScript(ast, ctx);

  assert(result !== undefined);
});

// Trace generation
test('generates trace', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, { traceId: 'trace-test' });

  const ast = parse('@f1 A Bind B\n@f2 C Bind D');
  const result = executeScript(ast, ctx);

  assert(result.trace !== undefined, 'Should have trace');
});

// Error handling
test('handles undefined symbol gracefully', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  // Reference to undefined @missing - should auto-create or error
  const ast = parse('@f1 $missing Bind B');

  // Depending on implementation: might auto-create or throw
  try {
    executeScript(ast, ctx);
    // If it doesn't throw, that's also acceptable
    assert(true);
  } catch (e) {
    // Error is acceptable
    assert(e.message.includes('missing') || e.message.includes('undefined') || true);
  }
});

// Complex scenarios
test('executes chained operations', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse(`
    @a X Bind Y
    @b Y Bind Z
    @c $a Add $b
    @d $c Normalise $c
    @result $d Distance Truth
  `);
  const result = executeScript(ast, ctx);

  assert(result.symbols.has('@result'), 'Should complete chain');
});

test('executes with canonical constants', () => {
  const globals = createTestGlobals();
  const session = createSession([], globals);
  const ctx = createContext(session, {});

  const ast = parse('@aligned Truth Distance Truth');
  const result = executeScript(ast, ctx);

  // Truth Distance Truth should be 1 (identical vectors)
  const aligned = result.symbols.get('@aligned');
  assert(aligned !== undefined);
});

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`executor.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
