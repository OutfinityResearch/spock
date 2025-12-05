/**
 * @fileoverview Unit tests for dependencyGraph.js
 */

'use strict';

const { buildGraph, topoSort, CycleError, getExecutionOrder } = require('../../src/dsl/dependencyGraph');
const { parse } = require('../../src/dsl/parser');

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
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

// ============== TESTS ==============

console.log('\ndependencyGraph.js');

// buildGraph tests
test('buildGraph: creates nodes for all declarations', () => {
  const ast = parse(`
    @Test theory begin
      @a X Is Y
      @b Y Is Z
      @c Z Is W
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  assert(graph.nodes.has('@a'), 'Should have @a');
  assert(graph.nodes.has('@b'), 'Should have @b');
  assert(graph.nodes.has('@c'), 'Should have @c');
});

test('buildGraph: detects dependencies', () => {
  const ast = parse(`
    @Test theory begin
      @a X Is Y
      @b $a Is Z
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  const edges = graph.edges.get('@b');
  assert(edges && edges.includes('@a'), '@b should depend on @a');
});

test('buildGraph: handles no dependencies', () => {
  const ast = parse(`
    @Test theory begin
      @a X Is Y
      @b Z Is W
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  const edgesA = graph.edges.get('@a') || [];
  const edgesB = graph.edges.get('@b') || [];
  assertEqual(edgesA.length, 0, '@a should have no dependencies');
  assertEqual(edgesB.length, 0, '@b should have no dependencies');
});

test('buildGraph: handles multiple dependencies', () => {
  const ast = parse(`
    @Test theory begin
      @a X Is Y
      @b Y Is Z
      @c $a Add $b
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  const edges = graph.edges.get('@c');
  assert(edges && edges.includes('@a'), '@c should depend on @a');
  assert(edges && edges.includes('@b'), '@c should depend on @b');
});

// topoSort tests
test('topoSort: returns all nodes', () => {
  const ast = parse(`
    @Test theory begin
      @a X Is Y
      @b Y Is Z
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  const order = topoSort(graph);
  assertEqual(order.length, 2);
  assert(order.includes('@a'));
  assert(order.includes('@b'));
});

test('topoSort: respects dependencies', () => {
  const ast = parse(`
    @Test theory begin
      @c $a Add $b
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

test('topoSort: handles chain of dependencies', () => {
  const ast = parse(`
    @Test theory begin
      @d $c Add Something
      @c $b Add Something
      @b $a Add Something
      @a X Is Y
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  const order = topoSort(graph);

  const aIdx = order.indexOf('@a');
  const bIdx = order.indexOf('@b');
  const cIdx = order.indexOf('@c');
  const dIdx = order.indexOf('@d');

  assert(aIdx < bIdx, '@a before @b');
  assert(bIdx < cIdx, '@b before @c');
  assert(cIdx < dIdx, '@c before @d');
});

test('topoSort: detects simple cycle', () => {
  const ast = parse(`
    @Test theory begin
      @a $b Is X
      @b $a Is Y
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  assertThrows(() => topoSort(graph), 'Should detect cycle');
});

test('topoSort: detects longer cycle', () => {
  const ast = parse(`
    @Test theory begin
      @a $c Is X
      @b $a Is Y
      @c $b Is Z
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  assertThrows(() => topoSort(graph), 'Should detect longer cycle');
});

test('topoSort: handles empty graph', () => {
  const ast = parse(`
    @Test theory begin
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  const order = topoSort(graph);
  assertEqual(order.length, 0);
});

// getExecutionOrder tests
test('getExecutionOrder: returns statements in order', () => {
  const ast = parse(`
    @Test theory begin
      @c $a Add $b
      @a X Is Y
      @b Y Is Z
    end
  `);
  const order = getExecutionOrder(ast.macros[0]);
  assertEqual(order.length, 3);

  // Find indexes
  const aIdx = order.findIndex(s => s.declaration === '@a');
  const bIdx = order.findIndex(s => s.declaration === '@b');
  const cIdx = order.findIndex(s => s.declaration === '@c');

  assert(aIdx < cIdx, '@a statement before @c');
  assert(bIdx < cIdx, '@b statement before @c');
});

// Special cases
test('handles self-reference in subject', () => {
  const ast = parse(`
    @Test theory begin
      @a X Is Y
      @result $a Identity $a
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  const edges = graph.edges.get('@result');
  assert(edges && edges.includes('@a'), 'Should depend on @a');
});

test('handles magic variables (no dependency)', () => {
  const ast = parse(`
    @Test verb begin
      @temp $subject Add $object
      @result $temp Identity $temp
    end
  `);
  const graph = buildGraph(ast.macros[0]);
  const tempEdges = graph.edges.get('@temp') || [];
  // $subject and $object should not create dependencies
  assert(!tempEdges.includes('$subject'), 'Should not depend on magic var');
});

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`dependencyGraph.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
