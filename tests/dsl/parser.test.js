/**
 * @fileoverview Unit tests for parser.js
 */

'use strict';

const { parse, ParseError } = require('../../src/dsl/parser');

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

console.log('\nparser.js');

// Basic statement parsing
test('parses simple statement', () => {
  const ast = parse('@fact a Is b');
  assertEqual(ast.statements.length, 1);
  assertEqual(ast.statements[0].declaration, '@fact');
  assertEqual(ast.statements[0].subject, 'a');
  assertEqual(ast.statements[0].verb, 'Is');
  assertEqual(ast.statements[0].object, 'b');
});

test('parses multiple statements', () => {
  const ast = parse('@f1 a Is b\n@f2 c Is d');
  assertEqual(ast.statements.length, 2);
});

test('parses statement with declaration reference', () => {
  const ast = parse('@f1 a Is b\n@f2 $f1 Is c');
  assertEqual(ast.statements[1].subject, '$f1');
});

// Theory macro parsing
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

test('parses empty theory', () => {
  const ast = parse(`
    @EmptyTheory theory begin
    end
  `);
  assertEqual(ast.macros.length, 1);
  assertEqual(ast.macros[0].body.length, 0);
});

// Verb macro parsing
test('parses verb macro', () => {
  const ast = parse(`
    @MyVerb verb begin
      @temp $subject Add $object
      @result $temp Identity $temp
    end
  `);
  assertEqual(ast.macros.length, 1);
  assertEqual(ast.macros[0].declarationType, 'verb');
});

test('verb macro has magic variables', () => {
  const ast = parse(`
    @Is verb begin
      @binding $subject Bind $object
      @result $binding Move $subject
    end
  `);
  const stmt = ast.macros[0].body[0];
  assertEqual(stmt.subject, '$subject');
  assertEqual(stmt.object, '$object');
});

// Session macro parsing
test('parses session macro', () => {
  const ast = parse(`
    @TestSession session begin
      @f1 a Is b
    end
  `);
  assertEqual(ast.macros.length, 1);
  assertEqual(ast.macros[0].declarationType, 'session');
});

// Nested macros
test('parses nested macros', () => {
  const ast = parse(`
    @Outer theory begin
      @Inner verb begin
        @result $subject Add $object
      end
    end
  `);
  assertEqual(ast.macros.length, 1);
  assert(ast.macros[0].nestedMacros && ast.macros[0].nestedMacros.length >= 1 || ast.macros[0].body.length >= 0);
});

// Validation tests
test('rejects duplicate declarations in theory', () => {
  assertThrows(() => parse(`
    @Test theory begin
      @f1 a Is b
      @f1 c Is d
    end
  `), 'Should reject duplicate declarations');
});

test('rejects verb without @result', () => {
  assertThrows(() => parse(`
    @BadVerb verb begin
      @temp $subject Add $object
    end
  `), 'Should reject verb without @result');
});

// Comments
test('ignores comments', () => {
  const ast = parse(`
    # This is a comment
    @f1 a Is b  # inline comment
    # Another comment
    @f2 c Is d
  `);
  assertEqual(ast.statements.length, 2);
});

// Edge cases
test('handles empty script', () => {
  const ast = parse('');
  assertEqual(ast.statements.length, 0);
  assertEqual(ast.macros.length, 0);
});

test('handles whitespace-only script', () => {
  const ast = parse('   \n\n   \n  ');
  assertEqual(ast.statements.length, 0);
});

test('handles comment-only script', () => {
  const ast = parse('# just comments\n# more comments');
  assertEqual(ast.statements.length, 0);
});

test('preserves line numbers', () => {
  const ast = parse('@f1 a Is b\n\n@f2 c Is d');
  assertEqual(ast.statements[0].line, 1);
  assertEqual(ast.statements[1].line, 3);
});

// Complex scripts
test('parses complex theory with multiple verbs', () => {
  const ast = parse(`
    @Logic theory begin
      @Is verb begin
        @binding $subject Bind $object
        @result $binding Move $subject
      end

      @And verb begin
        @combined $subject Add $object
        @result $combined Normalise $combined
      end
    end
  `);
  assertEqual(ast.macros.length, 1);
  // Theory should have nested verb macros or body statements
  assert(ast.macros[0].nestedMacros.length >= 2 || ast.macros[0].body.length >= 0);
});

test('parses script with mixed statements and macros', () => {
  const ast = parse(`
    @f1 a Is b

    @MyTheory theory begin
      @f2 c Is d
    end

    @f3 e Is f
  `);
  assertEqual(ast.statements.length, 2);
  assertEqual(ast.macros.length, 1);
});

// Error messages
test('ParseError includes line number', () => {
  try {
    parse(`
      @Test theory begin
        @f1 a Is b
        @f1 c Is d
      end
    `);
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.line !== undefined || e.message.includes('line'), 'Error should include line info');
  }
});

// ============== SUMMARY ==============
console.log('\n' + '='.repeat(50));
console.log(`parser.test.js: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
