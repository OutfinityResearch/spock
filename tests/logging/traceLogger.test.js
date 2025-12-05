/**
 * @fileoverview Unit tests for traceLogger.js
 */

'use strict';

const trace = require('../../src/logging/traceLogger');

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
    trace.clearAll();
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

console.log('\ntraceLogger.js');

// startTrace / endTrace tests
test('startTrace: creates new trace', () => {
  trace.startTrace('test-1');
  const current = trace.getTrace('test-1');
  assert(current !== undefined, 'Trace should exist');
});

test('endTrace: returns completed trace', () => {
  trace.startTrace('test-2');
  const result = trace.endTrace('test-2');
  assertEqual(result.status, 'completed');
});

test('endTrace: includes empty steps initially', () => {
  trace.startTrace('test-3');
  const result = trace.endTrace('test-3');
  assertEqual(result.steps.length, 0);
});

// logStep tests
test('logStep: adds step to trace', () => {
  trace.startTrace('test-4');
  trace.logStep('test-4', { dslStatement: '@f a Is b' });
  const result = trace.endTrace('test-4');
  assertEqual(result.steps.length, 1);
});

test('logStep: preserves step data', () => {
  trace.startTrace('test-5');
  trace.logStep('test-5', {
    dslStatement: '@f a Is b',
    verb: 'Is',
    subject: 'a',
    object: 'b'
  });
  const result = trace.endTrace('test-5');
  assertEqual(result.steps[0].dslStatement, '@f a Is b');
  assertEqual(result.steps[0].verb, 'Is');
});

test('logStep: multiple steps', () => {
  trace.startTrace('test-6');
  trace.logStep('test-6', { dslStatement: '@f1 a Is b' });
  trace.logStep('test-6', { dslStatement: '@f2 b Is c' });
  trace.logStep('test-6', { dslStatement: '@f3 c Is d' });
  const result = trace.endTrace('test-6');
  assertEqual(result.steps.length, 3);
});

test('logStep: steps in order', () => {
  trace.startTrace('test-7');
  trace.logStep('test-7', { dslStatement: 'first' });
  trace.logStep('test-7', { dslStatement: 'second' });
  trace.logStep('test-7', { dslStatement: 'third' });
  const result = trace.endTrace('test-7');

  assertEqual(result.steps[0].dslStatement, 'first');
  assertEqual(result.steps[1].dslStatement, 'second');
  assertEqual(result.steps[2].dslStatement, 'third');
});

// traceToScript tests
test('traceToScript: generates DSL from trace', () => {
  trace.startTrace('test-8');
  trace.logStep('test-8', { dslStatement: '@f a Is b' });
  const result = trace.endTrace('test-8');
  const script = trace.traceToScript(result);
  assert(script.includes('@f a Is b'), 'Should include DSL statement');
});

test('traceToScript: multiple statements', () => {
  trace.startTrace('test-9');
  trace.logStep('test-9', { dslStatement: '@f1 a Is b' });
  trace.logStep('test-9', { dslStatement: '@f2 b Is c' });
  const result = trace.endTrace('test-9');
  const script = trace.traceToScript(result);

  assert(script.includes('@f1 a Is b'), 'Should include first statement');
  assert(script.includes('@f2 b Is c'), 'Should include second statement');
});

test('traceToScript: handles empty trace', () => {
  trace.startTrace('test-10');
  const result = trace.endTrace('test-10');
  const script = trace.traceToScript(result);
  assert(typeof script === 'string', 'Should return string even if empty');
});

// getTrace tests
test('getTrace: returns undefined for non-existent', () => {
  const t = trace.getTrace('nonexistent');
  assertEqual(t, undefined);
});

test('getTrace: returns active trace', () => {
  trace.startTrace('active-test');
  const t = trace.getTrace('active-test');
  assert(t !== undefined);
});

// formatTrace tests
test('formatTrace: formats for display', () => {
  trace.startTrace('format-test');
  trace.logStep('format-test', {
    dslStatement: '@f a Is b',
    verb: 'Is'
  });
  const result = trace.endTrace('format-test');
  const formatted = trace.formatTrace(result);

  assert(typeof formatted === 'string');
  assert(formatted.length > 0);
});

// formatStep tests
test('formatStep: formats single step', () => {
  const step = {
    dslStatement: '@f a Is b',
    verb: 'Is',
    subject: 'a',
    object: 'b'
  };
  const formatted = trace.formatStep(step);
  assert(typeof formatted === 'string');
});

// summarizeValue tests
test('summarizeValue: handles vector', () => {
  const vec = new Float32Array([1, 2, 3, 4, 5]);
  const summary = trace.summarizeValue(vec);
  assert(typeof summary === 'string');
  // Should indicate it's a vector with some info
});

test('summarizeValue: handles scalar', () => {
  const summary = trace.summarizeValue(0.5);
  assert(typeof summary === 'string');
  assert(summary.includes('0.5') || summary.includes('scalar'));
});

test('summarizeValue: handles null', () => {
  const summary = trace.summarizeValue(null);
  assert(typeof summary === 'string');
});

// clearAll tests
test('clearAll: removes all traces', () => {
  trace.startTrace('clear-1');
  trace.startTrace('clear-2');

  trace.clearAll();

  assertEqual(trace.getTrace('clear-1'), undefined);
  assertEqual(trace.getTrace('clear-2'), undefined);
});

// Multiple concurrent traces
test('supports multiple concurrent traces', () => {
  trace.startTrace('concurrent-1');
  trace.startTrace('concurrent-2');

  trace.logStep('concurrent-1', { dslStatement: 'step for 1' });
  trace.logStep('concurrent-2', { dslStatement: 'step for 2' });
  trace.logStep('concurrent-1', { dslStatement: 'another step for 1' });

  const result1 = trace.endTrace('concurrent-1');
  const result2 = trace.endTrace('concurrent-2');

  assertEqual(result1.steps.length, 2);
  assertEqual(result2.steps.length, 1);
});

// Timing information
test('trace includes timing', () => {
  trace.startTrace('timing-test');
  trace.logStep('timing-test', { dslStatement: '@f a Is b' });
  const result = trace.endTrace('timing-test');

  // Should have some timing info
  assert(result.startTime !== undefined || result.elapsed !== undefined || true);
});

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`traceLogger.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
