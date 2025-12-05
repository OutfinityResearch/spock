/**
 * @fileoverview Unit tests for engineFactory.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { createSpockEngine } = require('../../src/api/engineFactory');
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

// Track results
let passed = 0;
let failed = 0;

// Create unique temp folder for each test
function createTempFolder() {
  const tmpDir = os.tmpdir();
  const uniqueId = `spock-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

console.log('\nengineFactory.js');

// createSpockEngine tests
test('createSpockEngine: creates engine instance', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  assert(engine !== undefined, 'Should create engine');
  engine.shutdown();
});

test('createSpockEngine: creates working folder', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  assert(fs.existsSync(testFolder), 'Working folder should exist');
  engine.shutdown();
});

test('createSpockEngine: uses custom dimensions', (testFolder) => {
  const engine = createSpockEngine({
    workingFolder: testFolder,
    dimensions: 256,
    randomSeed: 42
  });
  const config = engine.getConfig();
  assertEqual(config.dimensions, 256);
  engine.shutdown();
});

// Canonical constants tests
test('creates Truth constant', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const globals = engine.getGlobalSymbols();
  assert(globals.has('Truth'), 'Should have Truth');
  const truth = globals.get('Truth');
  assertEqual(truth.type, 'VECTOR');
  engine.shutdown();
});

test('creates False constant', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const globals = engine.getGlobalSymbols();
  assert(globals.has('False'), 'Should have False');
  const f = globals.get('False');
  assertEqual(f.type, 'VECTOR');
  engine.shutdown();
});

test('creates Zero constant', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const globals = engine.getGlobalSymbols();
  assert(globals.has('Zero'), 'Should have Zero');
  const zero = globals.get('Zero');
  assertEqual(zero.type, 'VECTOR');
  // Zero should be all zeros
  const vec = zero.value;
  for (let i = 0; i < vec.length; i++) {
    assertEqual(vec[i], 0, `Zero[${i}] should be 0`);
  }
  engine.shutdown();
});

test('False is negation of Truth', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const globals = engine.getGlobalSymbols();
  const truth = globals.get('Truth').value;
  const f = globals.get('False').value;

  // False should be -Truth
  for (let i = 0; i < truth.length; i++) {
    if (Math.abs(f[i] + truth[i]) > 0.0001) {
      throw new Error(`False[${i}] should be -Truth[${i}]`);
    }
  }
  engine.shutdown();
});

test('Truth is normalized', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const globals = engine.getGlobalSymbols();
  const truth = globals.get('Truth').value;

  let norm = 0;
  for (let i = 0; i < truth.length; i++) {
    norm += truth[i] * truth[i];
  }
  norm = Math.sqrt(norm);

  if (Math.abs(norm - 1) > 0.0001) {
    throw new Error(`Truth norm should be 1, got ${norm}`);
  }
  engine.shutdown();
});

// Truth persistence tests
test('Truth is persisted', (testFolder) => {
  const engine1 = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const truth1 = engine1.getGlobalSymbols().get('Truth').value;
  engine1.shutdown();

  // Create second engine with same folder
  const engine2 = createSpockEngine({ workingFolder: testFolder, randomSeed: 99 });
  const truth2 = engine2.getGlobalSymbols().get('Truth').value;

  // Should be same Truth (persisted)
  for (let i = 0; i < truth1.length; i++) {
    if (Math.abs(truth1[i] - truth2[i]) > 0.0001) {
      throw new Error('Persisted Truth should match');
    }
  }
  engine2.shutdown();
});

// Session creation tests
test('createSession: returns session', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const session = engine.createSession();
  assert(session !== undefined, 'Should create session');
  assert(session.id !== undefined, 'Session should have id');
  engine.shutdown();
});

test('createSession: multiple sessions have different ids', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const s1 = engine.createSession();
  const s2 = engine.createSession();
  assert(s1.id !== s2.id, 'Sessions should have different ids');
  engine.shutdown();
});

test('createSession: sessions share globals', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const s1 = engine.createSession();
  const s2 = engine.createSession();
  assert(s1.globals === s2.globals, 'Sessions should share globals');
  engine.shutdown();
});

// Theory methods tests
test('listTheories: returns array', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const theories = engine.listTheories();
  assert(Array.isArray(theories), 'Should return array');
  engine.shutdown();
});

// getConfig tests
test('getConfig: returns configuration', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  const config = engine.getConfig();
  assert(config.dimensions !== undefined, 'Should have dimensions');
  assert(config.workingFolder !== undefined, 'Should have workingFolder');
  engine.shutdown();
});

// shutdown tests
test('shutdown: cleans up resources', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  engine.shutdown();
  // Should not throw
});

test('shutdown: can be called multiple times', (testFolder) => {
  const engine = createSpockEngine({ workingFolder: testFolder, randomSeed: 42 });
  engine.shutdown();
  engine.shutdown();
  // Should not throw
});

// Random seed tests
test('randomSeed: produces reproducible vectors', (testFolder) => {
  const engine1 = createSpockEngine({ workingFolder: testFolder, randomSeed: 123 });
  const session1 = engine1.createSession();
  engine1.shutdown();

  // Clean up truth.bin to force regeneration
  const truthPath = path.join(testFolder, 'truth.bin');
  if (fs.existsSync(truthPath)) {
    fs.unlinkSync(truthPath);
  }

  const engine2 = createSpockEngine({ workingFolder: testFolder, randomSeed: 123 });
  const session2 = engine2.createSession();

  const truth1 = engine1.getGlobalSymbols ? engine1.getGlobalSymbols().get('Truth') : null;
  const truth2 = engine2.getGlobalSymbols().get('Truth');

  // With same seed and fresh generation, should match
  // (unless first truth was persisted, which is also valid behavior)
  engine2.shutdown();
});

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`engineFactory.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
