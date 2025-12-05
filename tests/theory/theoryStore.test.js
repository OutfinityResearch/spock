/**
 * @fileoverview Unit tests for theoryStore.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  loadTheory,
  saveTheory,
  listTheories,
  theoryExists,
  deleteTheory,
  createTheoryDescriptor,
  ensureTheoriesDirectory,
  astToText,
  getTheoryPath,
  TheoryNotFoundError
} = require('../../src/theory/theoryStore');
const { resetConfig, getConfig, setConfig } = require('../../src/config/config');

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
    setConfig({ workingFolder: '.spock-test-theories' });
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

// Cleanup helper
function cleanup() {
  const testFolder = '.spock-test-theories';
  if (fs.existsSync(testFolder)) {
    fs.rmSync(testFolder, { recursive: true });
  }
}

// ============== TESTS ==============

console.log('\ntheoryStore.js');

// ensureTheoriesDirectory tests
test('ensureTheoriesDirectory: creates directory', () => {
  cleanup();
  ensureTheoriesDirectory();
  const config = getConfig();
  const theoriesPath = path.join(config.workingFolder, 'theories');
  assert(fs.existsSync(theoriesPath), 'Theories directory should exist');
});

test('ensureTheoriesDirectory: idempotent', () => {
  cleanup();
  ensureTheoriesDirectory();
  ensureTheoriesDirectory();
  const config = getConfig();
  const theoriesPath = path.join(config.workingFolder, 'theories');
  assert(fs.existsSync(theoriesPath), 'Should still exist after second call');
});

// getTheoryPath tests
test('getTheoryPath: returns correct path', () => {
  const p = getTheoryPath('TestTheory');
  assert(p.includes('TestTheory'));
  assert(p.endsWith('.spockdsl'));
});

// createTheoryDescriptor tests
test('createTheoryDescriptor: creates descriptor', () => {
  const dsl = '@Test theory begin\n@f a Bind b\nend';
  const desc = createTheoryDescriptor('TestTheory', dsl);

  assertEqual(desc.name, 'TestTheory');
  assertEqual(desc.source, dsl);
  assert(desc.ast !== undefined, 'Should have AST');
});

test('createTheoryDescriptor: parses AST', () => {
  const dsl = '@Logic theory begin\n@f a Bind b\nend';
  const desc = createTheoryDescriptor('Logic', dsl);

  assert(desc.ast.macros.length >= 1, 'Should have macro in AST');
});

// saveTheory tests
test('saveTheory: saves to disk', () => {
  cleanup();
  ensureTheoriesDirectory();

  const dsl = '@SaveTest theory begin\n@f a Bind b\nend';
  saveTheory('SaveTest', dsl);

  const p = getTheoryPath('SaveTest');
  assert(fs.existsSync(p), 'Theory file should exist');
});

test('saveTheory: overwrites existing', () => {
  cleanup();
  ensureTheoriesDirectory();

  saveTheory('Overwrite', '@V1 theory begin\nend');
  saveTheory('Overwrite', '@V2 theory begin\nend');

  const loaded = loadTheory('Overwrite');
  assert(loaded.source.includes('V2'), 'Should have overwritten');
});

// loadTheory tests
test('loadTheory: loads existing theory', () => {
  cleanup();
  ensureTheoriesDirectory();

  const dsl = '@LoadTest theory begin\n@fact a Bind b\nend';
  saveTheory('LoadTest', dsl);

  const loaded = loadTheory('LoadTest');
  assertEqual(loaded.name, 'LoadTest');
  assert(loaded.source.includes('@fact a Bind b'));
});

test('loadTheory: throws for non-existent', () => {
  cleanup();
  ensureTheoriesDirectory();

  assertThrows(() => loadTheory('NonExistent'), 'Should throw for missing theory');
});

test('loadTheory: returns descriptor with AST', () => {
  cleanup();
  ensureTheoriesDirectory();

  saveTheory('ASTTest', '@ASTTest theory begin\n@f x Bind y\nend');
  const loaded = loadTheory('ASTTest');

  assert(loaded.ast !== undefined, 'Should have AST');
});

// theoryExists tests
test('theoryExists: returns true for existing', () => {
  cleanup();
  ensureTheoriesDirectory();

  saveTheory('Exists', '@Exists theory begin\nend');
  assert(theoryExists('Exists'));
});

test('theoryExists: returns false for missing', () => {
  cleanup();
  ensureTheoriesDirectory();

  assert(!theoryExists('NotHere'));
});

// listTheories tests
test('listTheories: returns empty for no theories', () => {
  cleanup();
  ensureTheoriesDirectory();

  const list = listTheories();
  assertEqual(list.length, 0);
});

test('listTheories: returns saved theories', () => {
  cleanup();
  ensureTheoriesDirectory();

  saveTheory('Theory1', '@T1 theory begin\nend');
  saveTheory('Theory2', '@T2 theory begin\nend');
  saveTheory('Theory3', '@T3 theory begin\nend');

  const list = listTheories();
  assertEqual(list.length, 3);
  assert(list.includes('Theory1'));
  assert(list.includes('Theory2'));
  assert(list.includes('Theory3'));
});

// deleteTheory tests
test('deleteTheory: removes theory file', () => {
  cleanup();
  ensureTheoriesDirectory();

  saveTheory('ToDelete', '@ToDelete theory begin\nend');
  assert(theoryExists('ToDelete'), 'Should exist before delete');

  deleteTheory('ToDelete');
  assert(!theoryExists('ToDelete'), 'Should not exist after delete');
});

test('deleteTheory: no error for non-existent', () => {
  cleanup();
  ensureTheoriesDirectory();

  // Should not throw
  deleteTheory('NeverExisted');
});

// astToText tests
test('astToText: converts simple AST to text', () => {
  const dsl = '@SimpleTheory theory begin\n@f a Bind b\nend';
  const desc = createTheoryDescriptor('SimpleTheory', dsl);
  const text = astToText(desc.ast);

  assert(typeof text === 'string');
  // Should contain key elements
});

// Error handling
test('loadTheory: TheoryNotFoundError', () => {
  cleanup();
  ensureTheoriesDirectory();

  try {
    loadTheory('Missing');
    assert(false, 'Should have thrown');
  } catch (e) {
    // Check it's the right error type or has right message
    assert(e.message.includes('Missing') || e.message.includes('not found'));
  }
});

// Complex theory
test('handles theory with multiple statements', () => {
  cleanup();
  ensureTheoriesDirectory();

  const dsl = `@ComplexTheory theory begin
    @f1 a Bind b
    @f2 b Bind c
    @f3 c Bind d
    @combined $f1 Add $f2
  end`;

  saveTheory('ComplexTheory', dsl);
  const loaded = loadTheory('ComplexTheory');

  assert(loaded.ast !== undefined);
  assert(loaded.source.includes('@f1 a Bind b'));
  assert(loaded.source.includes('@combined'));
});

// Theory with nested macros
test('handles theory with verb macro', () => {
  cleanup();
  ensureTheoriesDirectory();

  const dsl = `@LogicTheory theory begin
    @Is verb begin
      @binding $subject Bind $object
      @result $binding Move $subject
    end

    @f1 a Is b
  end`;

  saveTheory('LogicTheory', dsl);
  const loaded = loadTheory('LogicTheory');

  assert(loaded.source.includes('verb begin'));
});

// Cleanup after all tests
cleanup();

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`theoryStore.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
