/**
 * @fileoverview DSL tokenizer - splits text into tokens with type classification
 * @implements URS-004, FS-03, DS DSL
 */

'use strict';

/**
 * Reserved keywords in SpockDSL
 */
const KEYWORDS = new Set(['begin', 'end', 'theory', 'verb', 'session']);

/**
 * Token types
 */
const TokenType = {
  DECLARATION: 'declaration',   // @name
  MAGIC_VAR: 'magic_var',       // $subject, $object
  PLACEHOLDER: 'placeholder',   // _
  KEYWORD: 'keyword',           // begin, end, theory, verb, session
  IDENTIFIER: 'identifier',     // Socrates, Is, Human
  LITERAL: 'literal',           // 5, 3.14, -10
  COMMENT: 'comment'            // # comment (stripped)
};

/**
 * Classifies a token string into its type
 * @param {string} value - Token string
 * @returns {string} Token type
 */
function classifyToken(value) {
  if (value.startsWith('@')) {
    return TokenType.DECLARATION;
  }
  if (value.startsWith('$')) {
    return TokenType.MAGIC_VAR;
  }
  if (value === '_') {
    return TokenType.PLACEHOLDER;
  }
  if (KEYWORDS.has(value.toLowerCase())) {
    return TokenType.KEYWORD;
  }
  // Check if numeric literal
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return TokenType.LITERAL;
  }
  return TokenType.IDENTIFIER;
}

/**
 * Creates a token object
 * @param {string} value - Token value
 * @param {number} line - Line number (1-indexed)
 * @param {number} column - Column position (1-indexed)
 * @returns {Object} Token object
 */
function createToken(value, line, column) {
  return {
    value,
    type: classifyToken(value),
    line,
    column
  };
}

/**
 * Tokenizes a single line of DSL text
 * @param {string} line - Single line of code
 * @param {number} [lineNumber=1] - Line number for token positions
 * @returns {Array<Object>} Array of tokens
 */
function tokenizeLine(line, lineNumber = 1) {
  const tokens = [];

  // Strip comments (everything from # to end)
  const commentIndex = line.indexOf('#');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;

  // Skip empty lines
  if (codePart.trim().length === 0) {
    return tokens;
  }

  // Track column position
  let column = 1;
  let i = 0;

  while (i < codePart.length) {
    // Skip whitespace
    if (/\s/.test(codePart[i])) {
      i++;
      column++;
      continue;
    }

    // Find end of token
    let tokenStart = i;
    let startColumn = column;

    // Handle quoted strings (if needed in future)
    if (codePart[i] === '"') {
      i++;
      column++;
      while (i < codePart.length && codePart[i] !== '"') {
        i++;
        column++;
      }
      if (i < codePart.length) {
        i++; // Skip closing quote
        column++;
      }
      const value = codePart.substring(tokenStart, i);
      tokens.push(createToken(value, lineNumber, startColumn));
      continue;
    }

    // Regular token: read until whitespace
    while (i < codePart.length && !/\s/.test(codePart[i])) {
      i++;
      column++;
    }

    const value = codePart.substring(tokenStart, i);
    if (value.length > 0) {
      tokens.push(createToken(value, lineNumber, startColumn));
    }
  }

  return tokens;
}

/**
 * Tokenizes an entire DSL script
 * @param {string} text - Complete DSL script
 * @returns {Array<Object>} Array of all tokens with line numbers
 */
function tokenizeScript(text) {
  const lines = text.split(/\r?\n/);
  const allTokens = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;  // 1-indexed
    const lineTokens = tokenizeLine(lines[i], lineNumber);
    allTokens.push(...lineTokens);
  }

  return allTokens;
}

/**
 * Groups tokens by line for easier parsing
 * @param {Array<Object>} tokens - Flat array of tokens
 * @returns {Array<Array<Object>>} Array of token arrays, one per line
 */
function groupByLine(tokens) {
  const groups = [];
  let currentLine = -1;
  let currentGroup = [];

  for (const token of tokens) {
    if (token.line !== currentLine) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [token];
      currentLine = token.line;
    } else {
      currentGroup.push(token);
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Checks if a token is a macro header start
 * @param {Array<Object>} lineTokens - Tokens from a single line
 * @returns {boolean} True if line starts a macro
 */
function isMacroHeader(lineTokens) {
  if (lineTokens.length < 3) return false;

  return (
    lineTokens[0].type === TokenType.DECLARATION &&
    lineTokens[1].type === TokenType.KEYWORD &&
    ['theory', 'verb', 'session'].includes(lineTokens[1].value.toLowerCase()) &&
    lineTokens[2].type === TokenType.KEYWORD &&
    lineTokens[2].value.toLowerCase() === 'begin'
  );
}

/**
 * Checks if a line token is the 'end' keyword
 * @param {Array<Object>} lineTokens - Tokens from a single line
 * @returns {boolean} True if line is 'end'
 */
function isEndKeyword(lineTokens) {
  return (
    lineTokens.length === 1 &&
    lineTokens[0].type === TokenType.KEYWORD &&
    lineTokens[0].value.toLowerCase() === 'end'
  );
}

/**
 * Checks if a line is a statement (4 tokens: @decl subject verb object)
 * @param {Array<Object>} lineTokens - Tokens from a single line
 * @returns {boolean} True if valid statement form
 */
function isStatement(lineTokens) {
  return (
    lineTokens.length === 4 &&
    lineTokens[0].type === TokenType.DECLARATION
  );
}

module.exports = {
  TokenType,
  tokenizeLine,
  tokenizeScript,
  groupByLine,
  classifyToken,
  isMacroHeader,
  isEndKeyword,
  isStatement,
  KEYWORDS
};
