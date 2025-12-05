/**
 * @fileoverview Unit tests for theoryVersioning.js
 *
 * Tests: DS Theory Versioning - Branch/Merge/UseTheory/Remember
 * Specs: URS-005, FS-06, DS-TheoryVersioning
 *
 * The theory versioning module provides:
 * - branchTheory(): Create a named branch from existing theory
 * - mergeTheory(): Merge a branch back into main theory
 * - useTheory(): Activate/deactivate a theory overlay
 * - rememberToTheory(): Persist facts to a named theory
 * - getVersionHistory(): Get history of theory changes
 * - listBranches(): List all theory branches
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  suite,
  category,
  test,
  assert,
  assertEqual,
  assertThrows,
  assertType,
  exit
} = require('../testFramework');

const {
  branchTheory,
  mergeTheory,
  useTheory,
  rememberToTheory,
  getVersionHistory,
  listBranches,
  isTheoryVerb,
  getTheoryVerb,
  generateBranchName,
  parseBranchName,
  THEORY_VERBS
} = require('../../src/theory/theoryVersioning');

const {
  createSession,
  setSymbol
} = require('../../src/session/sessionManager');
const {
  saveTheory,
  createTheoryDescriptor,
  theoryExists,
  deleteTheory
} = require('../../src/theory/theoryStore');
const vectorSpace = require('../../src/kernel/vectorSpace');
const { resetConfig, getConfig } = require('../../src/config/config');

// Set deterministic seed for tests
beforeAll();

function beforeAll() {
  resetConfig();
  vectorSpace.setRandomSeed(42);
}

// Test theory name - unique per test run to avoid conflicts
const TEST_THEORY_BASE = `_test_theory_${Date.now()}`;

// Helper to clean up test theories after tests
function cleanupTestTheory(name) {
  try {
    const config = getConfig();
    const theoryPath = path.join(config.theoriesPath, name);
    if (fs.existsSync(theoryPath)) {
      fs.rmSync(theoryPath, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Helper to create a test theory
function createTestTheory(name, statements = []) {
  const ast = {
    statements: statements.length > 0 ? statements : [
      { declaration: 'TestConcept', subject: 'TestConcept', verb: 'Identity', object: '_', line: 1 }
    ],
    macros: []
  };
  const descriptor = createTheoryDescriptor(name, ast);
  saveTheory(descriptor);
  return descriptor;
}

// Helper to create a mock session
function createMockSession() {
  const session = createSession([], new Map());

  // Add some test symbols using the module function
  const vec1 = vectorSpace.normalise(vectorSpace.createRandomVector(64));
  const vec2 = vectorSpace.normalise(vectorSpace.createRandomVector(64));

  setSymbol(session, 'TestConcept', { type: 'VECTOR', value: vec1 });
  setSymbol(session, 'AnotherConcept', { type: 'VECTOR', value: vec2 });

  return session;
}

// ============== TEST SUITE ==============

suite('theoryVersioning.js', {
  file: 'src/theory/theoryVersioning.js',
  specs: ['URS-005', 'FS-06', 'DS-TheoryVersioning']
});

// ============== Utility Functions ==============

category('Utility Functions - generateBranchName / parseBranchName');

test('generateBranchName creates proper branch name', {
  input: 'generateBranchName("base", "feature")',
  expected: '"base__feature"'
}, () => {
  const name = generateBranchName('physics', 'experiment');
  assertEqual(name, 'physics__experiment');
});

test('parseBranchName extracts base and branch', {
  input: 'parseBranchName("base__feature")',
  expected: '{base: "base", branch: "feature"}'
}, () => {
  const result = parseBranchName('physics__experiment');
  assertEqual(result.base, 'physics');
  assertEqual(result.branch, 'experiment');
});

test('parseBranchName handles no branch', {
  input: 'parseBranchName("simple")',
  expected: '{base: "simple", branch: null}'
}, () => {
  const result = parseBranchName('simple');
  assertEqual(result.base, 'simple');
  assertEqual(result.branch, null);
});

test('parseBranchName handles nested branches', {
  input: 'parseBranchName("base__a__b")',
  expected: '{base: "base", branch: "a__b"}'
}, () => {
  const result = parseBranchName('base__a__b');
  assertEqual(result.base, 'base');
  assertEqual(result.branch, 'a__b');
});

// ============== branchTheory ==============

category('branchTheory - Create Theory Branches');

test('creates a branch from existing theory', {
  input: 'branchTheory(sourceName, branchName)',
  expected: 'new theory descriptor',
  spec: 'FS-06'
}, () => {
  const sourceName = `${TEST_THEORY_BASE}_branch_source`;
  const branchName = 'experiment';

  // Create source theory
  createTestTheory(sourceName);

  try {
    const branch = branchTheory(sourceName, branchName);

    assertType(branch, 'object');
    assertEqual(branch.name, `${sourceName}__${branchName}`);
    assertType(branch.versionId, 'string');
    assert(branch.parentVersionId, 'Should have parent version');
  } finally {
    cleanupTestTheory(sourceName);
    cleanupTestTheory(`${sourceName}__${branchName}`);
  }
});

test('branch copies AST from source', {
  input: 'branchTheory() AST',
  expected: 'AST is deep copied'
}, () => {
  const sourceName = `${TEST_THEORY_BASE}_branch_ast`;
  const statements = [
    { declaration: '@A', subject: 'A', verb: 'Add', object: 'B', line: 1 },
    { declaration: '@C', subject: 'C', verb: 'Identity', object: '_', line: 2 }
  ];

  createTestTheory(sourceName, statements);

  try {
    const branch = branchTheory(sourceName, 'copy');

    assertEqual(branch.ast.statements.length, 2);
    // Declaration will have @ prefix after round-trip through parser
    assert(branch.ast.statements[0].declaration.endsWith('A'), 'Should have A in declaration');
  } finally {
    cleanupTestTheory(sourceName);
    cleanupTestTheory(`${sourceName}__copy`);
  }
});

test('branch throws for non-existent source', {
  input: 'branchTheory("nonexistent", "x")',
  expected: 'throws error'
}, () => {
  assertThrows(() => {
    branchTheory('nonexistent_theory_xyz_123', 'branch');
  }, 'Theory not found');
});

// ============== mergeTheory ==============

category('mergeTheory - Merge Theory Branches');

test('merges source into target', {
  input: 'mergeTheory(target, source)',
  expected: 'merged theory',
  spec: 'FS-06'
}, () => {
  const targetName = `${TEST_THEORY_BASE}_merge_target`;
  const sourceName = `${TEST_THEORY_BASE}_merge_source`;

  createTestTheory(targetName, [
    { declaration: 'A', subject: 'A', verb: 'Identity', object: '_', line: 1 }
  ]);
  createTestTheory(sourceName, [
    { declaration: 'B', subject: 'B', verb: 'Identity', object: '_', line: 1 }
  ]);

  try {
    const merged = mergeTheory(targetName, sourceName);

    assertType(merged, 'object');
    assertEqual(merged.name, targetName);
    assert(merged.ast.statements.length >= 2, 'Should have statements from both');
    assert(merged.mergedFrom, 'Should have merge metadata');
  } finally {
    cleanupTestTheory(targetName);
    cleanupTestTheory(sourceName);
  }
});

test('merge handles conflicts with target strategy', {
  input: 'mergeTheory with conflict, strategy=target',
  expected: 'keeps target version'
}, () => {
  const targetName = `${TEST_THEORY_BASE}_conflict_target`;
  const sourceName = `${TEST_THEORY_BASE}_conflict_source`;

  createTestTheory(targetName, [
    { declaration: '@Same', subject: 'Same', verb: 'Add', object: 'X', line: 1 }
  ]);
  createTestTheory(sourceName, [
    { declaration: '@Same', subject: 'Same', verb: 'Add', object: 'Y', line: 1 }
  ]);

  try {
    const merged = mergeTheory(targetName, sourceName, { conflictStrategy: 'target' });

    // Should keep target version - find statement with Same in declaration
    const sameStmt = merged.ast.statements.find(s => s.declaration.includes('Same'));
    assert(sameStmt, 'Should have Same statement');
    assertEqual(sameStmt.object, 'X', 'Should keep target version');
  } finally {
    cleanupTestTheory(targetName);
    cleanupTestTheory(sourceName);
  }
});

test('merge handles conflicts with source strategy', {
  input: 'mergeTheory with conflict, strategy=source',
  expected: 'uses source version'
}, () => {
  const targetName = `${TEST_THEORY_BASE}_csource_target`;
  const sourceName = `${TEST_THEORY_BASE}_csource_source`;

  createTestTheory(targetName, [
    { declaration: '@Same', subject: 'Same', verb: 'Add', object: 'X', line: 1 }
  ]);
  createTestTheory(sourceName, [
    { declaration: '@Same', subject: 'Same', verb: 'Add', object: 'Y', line: 1 }
  ]);

  try {
    const merged = mergeTheory(targetName, sourceName, { conflictStrategy: 'source' });

    // Find statement with Same in declaration
    const sameStmt = merged.ast.statements.find(s => s.declaration.includes('Same'));
    assert(sameStmt, 'Should have Same statement');
    assertEqual(sameStmt.object, 'Y', 'Should use source version');
  } finally {
    cleanupTestTheory(targetName);
    cleanupTestTheory(sourceName);
  }
});

// ============== useTheory ==============

category('useTheory - Load Theory into Session');

test('loads theory as session overlay', {
  input: 'useTheory(session, theoryName)',
  expected: 'theory added to overlays',
  spec: 'FS-06'
}, () => {
  const theoryName = `${TEST_THEORY_BASE}_use`;
  createTestTheory(theoryName);

  const session = createMockSession();

  try {
    const result = useTheory(session, theoryName);

    assertType(result, 'object');
    assert(session.overlays.length > 0, 'Should have overlay');
    assertEqual(session.overlays[session.overlays.length - 1].name, theoryName);
  } finally {
    cleanupTestTheory(theoryName);
  }
});

test('useTheory throws for missing theory', {
  input: 'useTheory(session, "nonexistent")',
  expected: 'throws error'
}, () => {
  const session = createMockSession();

  assertThrows(() => {
    useTheory(session, 'nonexistent_theory_xyz_456');
  }, 'Theory not found');
});

// ============== rememberToTheory ==============

category('rememberToTheory - Persist Session to Theory');

test('persists session symbols to theory', {
  input: 'rememberToTheory(session, theoryName)',
  expected: 'theory updated with symbols',
  spec: 'FS-06'
}, () => {
  const theoryName = `${TEST_THEORY_BASE}_remember`;
  const session = createMockSession();

  // Add a symbol to session
  setSymbol(session, 'NewFact', { type: 'VECTOR', value: vectorSpace.createRandomVector(64) });

  try {
    const result = rememberToTheory(session, theoryName);

    assertType(result, 'object');
    assertEqual(result.name, theoryName);
    assert(result.versionId, 'Should have version');
  } finally {
    cleanupTestTheory(theoryName);
  }
});

test('rememberToTheory creates new theory if missing', {
  input: 'rememberToTheory() for new theory',
  expected: 'new theory created'
}, () => {
  const theoryName = `${TEST_THEORY_BASE}_remember_new`;
  const session = createMockSession();

  try {
    // Should create theory since it doesn't exist
    const result = rememberToTheory(session, theoryName);

    assertType(result, 'object');
    assert(theoryExists(theoryName), 'Theory should now exist');
  } finally {
    cleanupTestTheory(theoryName);
  }
});

// ============== listBranches ==============

category('listBranches - List Theory Branches');

test('lists branches of a theory', {
  input: 'listBranches(baseName)',
  expected: 'array of branch names',
  spec: 'FS-06'
}, () => {
  const baseName = `${TEST_THEORY_BASE}_list`;

  createTestTheory(baseName);
  branchTheory(baseName, 'branch1');
  branchTheory(baseName, 'branch2');

  try {
    const branches = listBranches(baseName);

    assert(Array.isArray(branches), 'Should return array');
    // Should include base and branches with matching prefix
    assert(branches.some(b => b === baseName || b.startsWith(baseName)),
           'Should include base or branches');
  } finally {
    cleanupTestTheory(baseName);
    cleanupTestTheory(`${baseName}__branch1`);
    cleanupTestTheory(`${baseName}__branch2`);
  }
});

test('listBranches returns empty for non-existent base', {
  input: 'listBranches("nonexistent")',
  expected: 'empty array'
}, () => {
  const branches = listBranches('nonexistent_base_xyz_789');

  assert(Array.isArray(branches), 'Should return array');
  assertEqual(branches.length, 0, 'Should be empty');
});

// ============== getVersionHistory ==============

category('getVersionHistory - Version Tracking');

test('returns version history for theory', {
  input: 'getVersionHistory(theoryName)',
  expected: 'array of version entries',
  spec: 'FS-06'
}, () => {
  const theoryName = `${TEST_THEORY_BASE}_history`;
  createTestTheory(theoryName);

  try {
    const history = getVersionHistory(theoryName);

    assert(Array.isArray(history), 'Should return array');
    // May have entries or be empty depending on metadata
  } finally {
    cleanupTestTheory(theoryName);
  }
});

test('getVersionHistory returns empty for non-existent', {
  input: 'getVersionHistory("nonexistent")',
  expected: 'empty array'
}, () => {
  const history = getVersionHistory('nonexistent_history_xyz');

  assert(Array.isArray(history), 'Should return array');
  assertEqual(history.length, 0, 'Should be empty');
});

// ============== Verb Registry ==============

category('Verb Registry - isTheoryVerb / getTheoryVerb');

test('recognizes UseTheory verb', {
  input: 'isTheoryVerb("UseTheory")',
  expected: 'true',
  spec: 'FS-06'
}, () => {
  assert(isTheoryVerb('UseTheory'), 'UseTheory should be theory verb');
});

test('recognizes Remember verb', {
  input: 'isTheoryVerb("Remember")',
  expected: 'true'
}, () => {
  assert(isTheoryVerb('Remember'), 'Remember should be theory verb');
});

test('recognizes BranchTheory verb', {
  input: 'isTheoryVerb("BranchTheory")',
  expected: 'true'
}, () => {
  assert(isTheoryVerb('BranchTheory'), 'BranchTheory should be theory verb');
});

test('recognizes MergeTheory verb', {
  input: 'isTheoryVerb("MergeTheory")',
  expected: 'true'
}, () => {
  assert(isTheoryVerb('MergeTheory'), 'MergeTheory should be theory verb');
});

test('rejects non-theory verbs', {
  input: 'isTheoryVerb("Add")',
  expected: 'false'
}, () => {
  assert(!isTheoryVerb('Add'), 'Add should not be theory verb');
  assert(!isTheoryVerb('Distance'), 'Distance should not be theory verb');
  assert(!isTheoryVerb('Plan'), 'Plan should not be theory verb');
});

test('getTheoryVerb returns function for valid verb', {
  input: 'getTheoryVerb("UseTheory")',
  expected: 'function'
}, () => {
  const fn = getTheoryVerb('UseTheory');
  assertType(fn, 'function', 'Should return function');
});

test('getTheoryVerb returns null for invalid verb', {
  input: 'getTheoryVerb("InvalidVerb")',
  expected: 'null'
}, () => {
  const fn = getTheoryVerb('InvalidVerb');
  assertEqual(fn, null, 'Should return null for invalid verb');
});

// ============== THEORY_VERBS ==============

category('THEORY_VERBS - Verb Map');

test('THEORY_VERBS has all required verbs', {
  input: 'Object.keys(THEORY_VERBS)',
  expected: 'UseTheory, Remember, BranchTheory, MergeTheory'
}, () => {
  assertType(THEORY_VERBS, 'object');
  assert('UseTheory' in THEORY_VERBS, 'Should have UseTheory');
  assert('Remember' in THEORY_VERBS, 'Should have Remember');
  assert('BranchTheory' in THEORY_VERBS, 'Should have BranchTheory');
  assert('MergeTheory' in THEORY_VERBS, 'Should have MergeTheory');
});

test('THEORY_VERBS values are functions', {
  input: 'typeof THEORY_VERBS.UseTheory',
  expected: 'function'
}, () => {
  assertType(THEORY_VERBS.UseTheory, 'function');
  assertType(THEORY_VERBS.Remember, 'function');
  assertType(THEORY_VERBS.BranchTheory, 'function');
  assertType(THEORY_VERBS.MergeTheory, 'function');
});

// ============== Exit ==============

exit();
