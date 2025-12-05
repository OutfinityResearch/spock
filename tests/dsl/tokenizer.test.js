/**
 * @fileoverview Unit tests for tokenizer.js
 *
 * Tests: DSL Engine - Tokenization
 * Specs: URS-004, FS-03, DS-DSL
 *
 * The tokenizer splits SpockDSL text into tokens:
 * - DECLARATION: @varName
 * - IDENTIFIER: concepts, verbs
 * - KEYWORD: theory, verb, session, begin, end
 * - MAGIC_VAR: $subject, $object
 * - PLACEHOLDER: _
 * - LITERAL: numeric values
 */

'use strict';

const {
  suite,
  category,
  test,
  skip,
  assert,
  assertEqual,
  assertThrows,
  exit
} = require('../testFramework');

const { tokenizeLine, tokenizeScript, TokenType } = require('../../src/dsl/tokenizer');

// ============== TEST SUITE ==============

suite('tokenizer.js', {
  file: 'src/dsl/tokenizer.js',
  specs: ['URS-004', 'FS-03', 'DS-DSL']
});

// ============== tokenizeLine - Basic Statements ==============

category('tokenizeLine - Basic Statements');

test('basic statement produces 4 tokens', {
  input: '"@fact1 a In b"',
  expected: '4 tokens: [@fact1, a, In, b]',
  spec: 'FS-03'
}, () => {
  const tokens = tokenizeLine('@fact1 a In b');
  assertEqual(tokens.length, 4);
});

test('comment is stripped', {
  input: '"@fact1 a In b # this is a comment"',
  expected: '4 tokens (comment removed)'
}, () => {
  const tokens = tokenizeLine('@fact1 a In b # this is a comment');
  assertEqual(tokens.length, 4, 'Comment should be stripped');
});

test('empty line produces no tokens', {
  input: '""',
  expected: '0 tokens'
}, () => {
  const tokens = tokenizeLine('');
  assertEqual(tokens.length, 0);
});

test('whitespace-only line produces no tokens', {
  input: '"   "',
  expected: '0 tokens'
}, () => {
  const tokens = tokenizeLine('   ');
  assertEqual(tokens.length, 0);
});

// ============== Token Types ==============

category('Token Type Classification');

test('declaration token (@varName)', {
  input: '"@fact1 a Is b"',
  expected: 'First token type = DECLARATION',
  spec: 'FS-03'
}, () => {
  const tokens = tokenizeLine('@fact1 a Is b');
  assertEqual(tokens[0].type, TokenType.DECLARATION, 'First token should be declaration');
  assertEqual(tokens[0].value, '@fact1');
});

test('identifier tokens (concepts, verbs)', {
  input: '"@f Socrates Is Human"',
  expected: 'Socrates, Is, Human are IDENTIFIER'
}, () => {
  const tokens = tokenizeLine('@f Socrates Is Human');
  assertEqual(tokens[1].type, TokenType.IDENTIFIER);
  assertEqual(tokens[1].value, 'Socrates');
  assertEqual(tokens[2].type, TokenType.IDENTIFIER);
  assertEqual(tokens[3].type, TokenType.IDENTIFIER);
});

test('magic variables ($subject, $object)', {
  input: '"@result $subject Bind $object"',
  expected: '$subject, $object are MAGIC_VAR',
  spec: 'FS-03'
}, () => {
  const tokens = tokenizeLine('@result $subject Bind $object');
  assertEqual(tokens[1].type, TokenType.MAGIC_VAR);
  assertEqual(tokens[1].value, '$subject');
  assertEqual(tokens[3].type, TokenType.MAGIC_VAR);
  assertEqual(tokens[3].value, '$object');
});

test('placeholder (_)', {
  input: '"@use _ UseTheory BasicLogic"',
  expected: '_ is PLACEHOLDER'
}, () => {
  const tokens = tokenizeLine('@use _ UseTheory BasicLogic');
  assertEqual(tokens[1].type, TokenType.PLACEHOLDER);
  assertEqual(tokens[1].value, '_');
});

test('theory keyword', {
  input: '"@Logic theory begin"',
  expected: 'theory, begin are KEYWORD',
  spec: 'FS-03'
}, () => {
  const tokens = tokenizeLine('@Logic theory begin');
  assertEqual(tokens[1].type, TokenType.KEYWORD);
  assertEqual(tokens[1].value, 'theory');
  assertEqual(tokens[2].type, TokenType.KEYWORD);
  assertEqual(tokens[2].value, 'begin');
});

test('end keyword', {
  input: '"end"',
  expected: 'end is KEYWORD'
}, () => {
  const tokens = tokenizeLine('end');
  assertEqual(tokens[0].type, TokenType.KEYWORD);
});

test('verb keyword', {
  input: '"@V verb begin"',
  expected: 'verb is KEYWORD'
}, () => {
  const tokens = tokenizeLine('@V verb begin');
  assertEqual(tokens[1].type, TokenType.KEYWORD);
});

test('session keyword', {
  input: '"@S session begin"',
  expected: 'session is KEYWORD'
}, () => {
  const tokens = tokenizeLine('@S session begin');
  assertEqual(tokens[1].type, TokenType.KEYWORD);
});

// ============== Numeric Literals ==============

category('Numeric Literals');

test('integer literal', {
  input: '"@x 5 HasValue 10"',
  expected: '5 is LITERAL',
  spec: 'FS-05'
}, () => {
  const tokens = tokenizeLine('@x 5 HasValue 10');
  assertEqual(tokens[1].type, TokenType.LITERAL);
  assertEqual(tokens[1].value, '5');
});

test('float literal', {
  input: '"@x 3.14 HasValue Pi"',
  expected: '3.14 is LITERAL'
}, () => {
  const tokens = tokenizeLine('@x 3.14 HasValue Pi');
  assertEqual(tokens[1].type, TokenType.LITERAL);
  assertEqual(tokens[1].value, '3.14');
});

test('negative number', {
  input: '"@x -5 HasValue NegFive"',
  expected: 'Parses without error'
}, () => {
  const tokens = tokenizeLine('@x -5 HasValue NegFive');
  assert(tokens.length >= 3);
});

// ============== tokenizeScript - Multi-line ==============

category('tokenizeScript - Multi-line Processing');

test('multi-line script', {
  input: '"@f1 a Is b\\n@f2 c Is d"',
  expected: '8 tokens from both lines',
  spec: 'FS-03'
}, () => {
  const script = '@f1 a Is b\n@f2 c Is d';
  const tokens = tokenizeScript(script);
  assert(tokens.length >= 8, 'Should have tokens from both lines');
});

test('preserves line numbers', {
  input: '"@f1 a Is b\\n@f2 c Is d"',
  expected: 'Line 1 and line 2 tokens'
}, () => {
  const script = '@f1 a Is b\n@f2 c Is d';
  const tokens = tokenizeScript(script);
  const line1Tokens = tokens.filter(t => t.line === 1);
  const line2Tokens = tokens.filter(t => t.line === 2);
  assert(line1Tokens.length > 0, 'Should have tokens on line 1');
  assert(line2Tokens.length > 0, 'Should have tokens on line 2');
});

test('empty lines preserved in numbering', {
  input: '"@f1 a Is b\\n\\n@f2 c Is d"',
  expected: 'Line 1, Line 3 (skip line 2)'
}, () => {
  const script = '@f1 a Is b\n\n@f2 c Is d';
  const tokens = tokenizeScript(script);
  const line3Tokens = tokens.filter(t => t.line === 3);
  assert(line3Tokens.length > 0, 'Line 3 should have tokens');
});

test('comment-only lines', {
  input: '"# comment\\n@f1 a Is b"',
  expected: 'Declaration on line 2'
}, () => {
  const script = '# comment\n@f1 a Is b';
  const tokens = tokenizeScript(script);
  const declarations = tokens.filter(t => t.type === TokenType.DECLARATION);
  assertEqual(declarations.length, 1, 'Should have one declaration');
  assertEqual(declarations[0].line, 2, 'Declaration should be on line 2');
});

test('macro header tokenization', {
  input: '"@Logic theory begin"',
  expected: '3 tokens: DECLARATION, KEYWORD, KEYWORD'
}, () => {
  const tokens = tokenizeLine('@Logic theory begin');
  assertEqual(tokens.length, 3);
  assertEqual(tokens[0].type, TokenType.DECLARATION);
  assertEqual(tokens[1].type, TokenType.KEYWORD);
  assertEqual(tokens[2].type, TokenType.KEYWORD);
});

// ============== Edge Cases ==============

category('Edge Cases');

test('tab characters as separators', {
  input: '"@f1\\ta\\tIs\\tb"',
  expected: '4 tokens'
}, () => {
  const tokens = tokenizeLine('@f1\ta\tIs\tb');
  assertEqual(tokens.length, 4, 'Tabs should split tokens');
});

test('multiple spaces between tokens', {
  input: '"@f1   a   Is   b"',
  expected: '4 tokens'
}, () => {
  const tokens = tokenizeLine('@f1   a   Is   b');
  assertEqual(tokens.length, 4, 'Multiple spaces should be handled');
});

test('underscore in identifier', {
  input: '"@f my_var Is other_var"',
  expected: 'Valid identifiers with underscores'
}, () => {
  const tokens = tokenizeLine('@f my_var Is other_var');
  assertEqual(tokens[1].value, 'my_var');
  assertEqual(tokens[3].value, 'other_var');
});

test('declaration reference as operand', {
  input: '"@f2 @f1 Is Something"',
  expected: '@f1 parsed as operand'
}, () => {
  const tokens = tokenizeLine('@f2 @f1 Is Something');
  assertEqual(tokens[0].type, TokenType.DECLARATION);
  assert(tokens.length >= 4);
});

test('mixed case identifiers', {
  input: '"@fact socrates IS human"',
  expected: 'Case preserved'
}, () => {
  const tokens = tokenizeLine('@fact socrates IS human');
  assertEqual(tokens[1].value, 'socrates');
  assertEqual(tokens[2].value, 'IS');
  assertEqual(tokens[3].value, 'human');
});

// ============== Complex Scripts ==============

category('Complex Scripts');

test('theory with multiple statements', {
  input: 'Theory macro with body',
  expected: 'All tokens with correct line numbers',
  spec: 'FS-03'
}, () => {
  const script = `@Logic theory begin
    @f1 a Is b
    @f2 b Is c
end`;
  const tokens = tokenizeScript(script);

  // Should have tokens for header, body, and end
  const declarations = tokens.filter(t => t.type === TokenType.DECLARATION);
  assert(declarations.length >= 3, 'Should have 3 declarations (@Logic, @f1, @f2)');

  // Check line numbers
  const endToken = tokens.find(t => t.value === 'end');
  assert(endToken !== undefined, 'Should have end token');
  assertEqual(endToken.line, 4, 'end should be on line 4');
});

test('verb macro with magic variables', {
  input: 'Verb macro with $subject, $object',
  expected: 'Magic vars correctly identified'
}, () => {
  const script = `@Is verb begin
    @binding $subject Bind $object
    @result $binding Move $subject
end`;
  const tokens = tokenizeScript(script);

  const magicVars = tokens.filter(t => t.type === TokenType.MAGIC_VAR);
  assert(magicVars.length >= 3, 'Should have multiple magic variables');
});

// ============== Exit ==============

exit();
