/**
 * @fileoverview Test runner for Spock GOS
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Track test results
let passed = 0;
let failed = 0;
const failures = [];

/**
 * Simple assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertClose(actual, expected, tolerance = 0.001, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(message || `Expected ${expected} ± ${tolerance}, got ${actual}`);
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

/**
 * Runs a test
 */
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e });
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

/**
 * Describes a test suite
 */
function describe(suiteName, fn) {
  console.log(`\n${suiteName}`);
  fn();
}

// Make helpers global for test files
global.test = test;
global.describe = describe;
global.assert = assert;
global.assertEqual = assertEqual;
global.assertClose = assertClose;
global.assertThrows = assertThrows;

// ============== TESTS ==============

describe('config.js', () => {
  const { getConfig, setConfig, resetConfig, DEFAULTS } = require('../src/config/config');

  test('returns default configuration', () => {
    resetConfig();
    const config = getConfig();
    assertEqual(config.dimensions, 512);
    assertEqual(config.logLevel, 'summary');
  });

  test('setConfig updates values', () => {
    resetConfig();
    setConfig({ dimensions: 1024 });
    const config = getConfig();
    assertEqual(config.dimensions, 1024);
  });

  test('validates dimensions', () => {
    resetConfig();
    assertThrows(() => setConfig({ dimensions: 100 }), 'Should reject non-power-of-2');
  });

  test('returns frozen config', () => {
    resetConfig();
    const config = getConfig();
    assertThrows(() => { config.dimensions = 999; }, 'Should be frozen');
  });
});

describe('vectorSpace.js', () => {
  const vectorSpace = require('../src/kernel/vectorSpace');
  const { resetConfig } = require('../src/config/config');

  test('createVector returns zero vector', () => {
    resetConfig();
    const v = vectorSpace.createVector(10);
    assertEqual(v.length, 10);
    assertEqual(v[0], 0);
    assertEqual(v[9], 0);
  });

  test('createRandomVector returns non-zero', () => {
    const v = vectorSpace.createRandomVector(100);
    assertEqual(v.length, 100);
    const sum = v.reduce((a, b) => a + Math.abs(b), 0);
    assert(sum > 0, 'Should have non-zero elements');
  });

  test('dot product', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const result = vectorSpace.dot(a, b);
    assertEqual(result, 32);  // 1*4 + 2*5 + 3*6
  });

  test('norm', () => {
    const v = new Float32Array([3, 4]);
    const n = vectorSpace.norm(v);
    assertEqual(n, 5);  // sqrt(9 + 16)
  });

  test('normalise', () => {
    const v = new Float32Array([3, 4]);
    const n = vectorSpace.normalise(v);
    assertClose(vectorSpace.norm(n), 1.0);
  });

  test('cosineSimilarity identical vectors', () => {
    const v = new Float32Array([1, 2, 3]);
    const sim = vectorSpace.cosineSimilarity(v, v);
    assertClose(sim, 1.0);
  });
});

describe('primitiveOps.js', () => {
  const ops = require('../src/kernel/primitiveOps');

  test('add vectors', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const r = ops.add(a, b);
    assertEqual(r[0], 5);
    assertEqual(r[1], 7);
    assertEqual(r[2], 9);
  });

  test('negate vector', () => {
    const v = new Float32Array([1, -2, 3]);
    const r = ops.negate(v);
    assertEqual(r[0], -1);
    assertEqual(r[1], 2);
    assertEqual(r[2], -3);
  });

  test('modulate with scalar', () => {
    const v = new Float32Array([2, 4, 6]);
    const r = ops.modulate(v, 0.5);
    assertEqual(r[0], 1);
    assertEqual(r[1], 2);
    assertEqual(r[2], 3);
  });

  test('distance returns scalar', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([1, 0]);
    const d = ops.distance(a, b);
    assert(typeof d === 'number', 'Should return number');
    assertClose(d, 1.0);  // Identical vectors -> similarity 1
  });

  test('isKernelVerb', () => {
    assert(ops.isKernelVerb('Add'));
    assert(ops.isKernelVerb('Modulate'));
    assert(!ops.isKernelVerb('CustomVerb'));
  });
});

describe('tokenizer.js', () => {
  const { tokenizeLine, tokenizeScript, TokenType } = require('../src/dsl/tokenizer');

  test('tokenizes declaration', () => {
    const tokens = tokenizeLine('@fact1 a In b');
    assertEqual(tokens.length, 4);
    assertEqual(tokens[0].type, TokenType.DECLARATION);
    assertEqual(tokens[0].value, '@fact1');
  });

  test('tokenizes magic variables', () => {
    const tokens = tokenizeLine('@result $subject Bind $object');
    assertEqual(tokens[1].type, TokenType.MAGIC_VAR);
    assertEqual(tokens[3].type, TokenType.MAGIC_VAR);
  });

  test('strips comments', () => {
    const tokens = tokenizeLine('@fact a Is b # this is a comment');
    assertEqual(tokens.length, 4);
  });

  test('tokenizes keywords', () => {
    const tokens = tokenizeLine('@Theory theory begin');
    assertEqual(tokens[1].type, TokenType.KEYWORD);
    assertEqual(tokens[2].type, TokenType.KEYWORD);
  });
});

describe('parser.js', () => {
  const { parse, ParseError } = require('../src/dsl/parser');

  test('parses simple statement', () => {
    const ast = parse('@fact a Is b');
    assertEqual(ast.statements.length, 1);
    assertEqual(ast.statements[0].declaration, '@fact');
    assertEqual(ast.statements[0].subject, 'a');
    assertEqual(ast.statements[0].verb, 'Is');
    assertEqual(ast.statements[0].object, 'b');
  });

  test('parses theory macro', () => {
    const ast = parse(`
      @Logic theory begin
        @f1 a Is b
        @f2 b Is c
      end
    `);
    assertEqual(ast.macros.length, 1);
    assertEqual(ast.macros[0].name, '@Logic');
    assertEqual(ast.macros[0].declarationType, 'theory');
    assertEqual(ast.macros[0].body.length, 2);
  });

  test('parses verb macro', () => {
    const ast = parse(`
      @MyVerb verb begin
        @temp $subject Add $object
        @result temp Identity temp
      end
    `);
    assertEqual(ast.macros[0].declarationType, 'verb');
  });

  test('rejects duplicate declarations', () => {
    assertThrows(() => parse(`
      @Test theory begin
        @f1 a Is b
        @f1 c Is d
      end
    `));
  });

  test('rejects verb without @result', () => {
    assertThrows(() => parse(`
      @BadVerb verb begin
        @temp $subject Add $object
      end
    `));
  });
});

describe('dependencyGraph.js', () => {
  const { buildGraph, topoSort, CycleError } = require('../src/dsl/dependencyGraph');
  const { parse } = require('../src/dsl/parser');

  test('builds graph from macro', () => {
    const ast = parse(`
      @Test theory begin
        @a X Is Y
        @b @a Is Z
      end
    `);
    const graph = buildGraph(ast.macros[0]);
    assert(graph.nodes.has('@a'));
    assert(graph.nodes.has('@b'));
    assertEqual(graph.edges.get('@b').length, 1);
  });

  test('topological sort respects dependencies', () => {
    const ast = parse(`
      @Test theory begin
        @c @a Add @b
        @a X Is Y
        @b Y Is Z
      end
    `);
    const graph = buildGraph(ast.macros[0]);
    const order = topoSort(graph);
    const aIndex = order.indexOf('@a');
    const bIndex = order.indexOf('@b');
    const cIndex = order.indexOf('@c');
    assert(aIndex < cIndex, '@a must come before @c');
    assert(bIndex < cIndex, '@b must come before @c');
  });

  test('detects cycles', () => {
    const ast = parse(`
      @Test theory begin
        @a @b Is X
        @b @a Is Y
      end
    `);
    const graph = buildGraph(ast.macros[0]);
    assertThrows(() => topoSort(graph));
  });
});

describe('traceLogger.js', () => {
  const trace = require('../src/logging/traceLogger');

  test('starts and ends trace', () => {
    trace.clearAll();
    trace.startTrace('test-1');
    const result = trace.endTrace('test-1');
    assertEqual(result.status, 'completed');
    assertEqual(result.steps.length, 0);
  });

  test('logs steps', () => {
    trace.clearAll();
    trace.startTrace('test-2');
    trace.logStep('test-2', { dslStatement: '@f a Is b' });
    trace.logStep('test-2', { dslStatement: '@g b Is c' });
    const result = trace.endTrace('test-2');
    assertEqual(result.steps.length, 2);
  });

  test('traceToScript generates DSL', () => {
    trace.clearAll();
    trace.startTrace('test-3');
    trace.logStep('test-3', { dslStatement: '@f a Is b' });
    const result = trace.endTrace('test-3');
    const script = trace.traceToScript(result);
    assert(script.includes('@f a Is b'));
  });
});

describe('Integration: Engine and Session', () => {
  const { createSpockEngine } = require('../src/api/engineFactory');
  const { createSessionApi } = require('../src/api/sessionApi');
  const { resetConfig } = require('../src/config/config');

  test('creates engine with canonical constants', () => {
    resetConfig();
    const engine = createSpockEngine({
      workingFolder: '.spock-test',
      randomSeed: 42
    });

    const globals = engine.getGlobalSymbols();
    assert(globals.has('Truth'), 'Should have Truth');
    assert(globals.has('False'), 'Should have False');
    assert(globals.has('Zero'), 'Should have Zero');

    engine.shutdown();
  });

  test('executes simple script', () => {
    resetConfig();
    const engine = createSpockEngine({
      workingFolder: '.spock-test',
      randomSeed: 42
    });

    const session = engine.createSession();
    const api = createSessionApi(session);

    const result = api.learn('@fact Socrates Is Human');
    assert(result.success, 'Should succeed');
    assert(result.symbols.has('@fact'), 'Should have @fact');

    engine.shutdown();
  });

  test('truth alignment works', () => {
    resetConfig();
    const engine = createSpockEngine({
      workingFolder: '.spock-test',
      randomSeed: 42
    });

    const session = engine.createSession();
    const api = createSessionApi(session);

    // Learn some facts
    api.learn('@f1 Socrates Is Human');
    api.learn('@f2 Human Is Mortal');

    // Result should have truth score
    const result = api.ask('@query @f1 Distance @f2');
    assert(result.success, 'Should succeed');
    assert(result.scores.truth >= 0 && result.scores.truth <= 1, 'Truth should be in [0,1]');

    engine.shutdown();
  });
});

// ============== SUMMARY ==============

console.log('\n' + '='.repeat(50));
console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.error.message}`);
  }
  process.exit(1);
}

console.log('\nAll tests passed!');
process.exit(0);
