/**
 * @fileoverview Unit tests for sessionApi.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { createSpockEngine } = require('../../src/api/engineFactory');
const { createSessionApi } = require('../../src/api/sessionApi');
const { resetConfig } = require('../../src/config/config');

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

function assertClose(actual, expected, tolerance = 0.01) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${expected} ± ${tolerance}, got ${actual}`);
  }
}

// Track results
let passed = 0;
let failed = 0;

// Create unique temp folder for each test
function createTempFolder() {
  const tmpDir = os.tmpdir();
  const uniqueId = `spock-api-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const folder = path.join(tmpDir, uniqueId);
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

function cleanupFolder(folder) {
  try {
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

function test(name, fn) {
  const testFolder = createTempFolder();
  try {
    resetConfig();
    fn(testFolder);
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  } finally {
    cleanupFolder(testFolder);
  }
}

// ============== TESTS ==============

console.log('\nsessionApi.js');

// createSessionApi tests
test('createSessionApi: creates API wrapper', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  assert(api !== undefined, 'Should create API');
  assert(typeof api.learn === 'function', 'Should have learn method');
  assert(typeof api.ask === 'function', 'Should have ask method');
  engine.shutdown();
});

// learn method tests
test('learn: returns success for valid DSL', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.learn('@fact Socrates Is Human');
  assert(result.success, 'Should succeed');
  engine.shutdown();
});

test('learn: creates symbols', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.learn('@fact Socrates Is Human');
  assert(result.symbols.has('@fact'), 'Should have @fact symbol');
  engine.shutdown();
});

test('learn: returns scores', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.learn('@fact Socrates Is Human');
  assert(result.scores !== undefined, 'Should have scores');
  assert(result.scores.truth !== undefined, 'Should have truth score');
  engine.shutdown();
});

test('learn: returns error for invalid DSL', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  // Invalid DSL - duplicate declarations in theory
  const result = api.learn(`
    @BadTheory theory begin
      @f1 a Is b
      @f1 c Is d
    end
  `);
  assertEqual(result.success, false);
  assert(result.error !== undefined, 'Should have error message');
  engine.shutdown();
});

// ask method tests
test('ask: executes query', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.ask('@query Socrates Is Human');
  assert(result.success, 'Should succeed');
  engine.shutdown();
});

test('ask: computes truth scores', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  api.learn('@f1 Socrates Is Human');
  api.learn('@f2 Human Is Mortal');

  const result = api.ask('@query $f1 Distance $f2');
  assert(result.success);
  assert(result.scores.truth >= 0 && result.scores.truth <= 1, 'Truth should be in [0,1]');
  engine.shutdown();
});

// prove method tests
test('prove: returns result', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.prove('@f1 A Is B');
  assert(result !== undefined);
  engine.shutdown();
});

// explain method tests
test('explain: returns result', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.explain('@f1 A Is B');
  assert(result !== undefined);
  engine.shutdown();
});

// plan method tests
test('plan: returns result', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.plan('@f1 Start Is Goal');
  assert(result !== undefined);
  engine.shutdown();
});

// solve method tests
test('solve: returns result', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.solve('@f1 X Is Y');
  assert(result !== undefined);
  engine.shutdown();
});

// summarise method tests
test('summarise: returns result', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.summarise('@f1 A Is B');
  assert(result !== undefined);
  engine.shutdown();
});

// getStats method tests
test('getStats: returns stats', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const stats = api.getStats();
  assert(stats.sessionId !== undefined, 'Should have sessionId');
  assert(stats.symbolCount !== undefined, 'Should have symbolCount');
  engine.shutdown();
});

test('getStats: symbol count increases', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const before = api.getStats().symbolCount;
  api.learn('@f1 A Is B');
  const after = api.getStats().symbolCount;

  assert(after > before, 'Symbol count should increase');
  engine.shutdown();
});

// getSession method tests
test('getSession: returns underlying session', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const retrieved = api.getSession();
  assertEqual(retrieved.id, session.id);
  engine.shutdown();
});

// DSL output tests
test('returns dslOutput', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.ask('@fact Socrates Is Human');
  assert(result.dslOutput !== undefined, 'Should have dslOutput');
  engine.shutdown();
});

// Trace tests
test('returns trace', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  const result = api.ask('@fact Socrates Is Human');
  assert(result.trace !== undefined, 'Should have trace');
  engine.shutdown();
});

// Complex scenarios
test('chained reasoning', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  api.learn('@f1 A Is B');
  api.learn('@f2 B Is C');
  api.learn('@f3 C Is D');

  const result = api.ask('@combined $f1 Add $f2\n@result $combined Add $f3');
  assert(result.success, 'Chained reasoning should succeed');
  engine.shutdown();
});

test('truth alignment', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  const api = createSessionApi(session);

  // Truth Distance Truth should give high similarity
  const result = api.ask('@result Truth Distance Truth');

  // This tests that Truth is accessible and Distance works
  assert(result.success);
  engine.shutdown();
});

test('multiple sessions independent', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });

  const session1 = engine.createSession();
  const api1 = createSessionApi(session1);
  api1.learn('@onlyInSession1 A Is B');

  const session2 = engine.createSession();
  const api2 = createSessionApi(session2);

  // Session 2 should not see session 1's local symbols
  const stats1 = api1.getStats();
  const stats2 = api2.getStats();

  assert(stats1.symbolCount > stats2.symbolCount, 'Sessions should be independent');
  engine.shutdown();
});

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`sessionApi.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
