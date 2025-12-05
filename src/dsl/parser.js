/**
 * @fileoverview DSL parser - converts tokens to AST
 * @implements URS-004, FS-03, DS DSL
 */

'use strict';

const { tokenizeScript, groupByLine, TokenType, isMacroHeader, isEndKeyword } = require('./tokenizer');

/**
 * AST node types
 */
const NodeType = {
  SCRIPT: 'script',
  MACRO: 'macro',
  STATEMENT: 'statement'
};

/**
 * Parser error with location info
 */
class ParseError extends Error {
  constructor(message, line, column) {
    super(`Parse error at line ${line}${column ? `, column ${column}` : ''}: ${message}`);
    this.name = 'ParseError';
    this.line = line;
    this.column = column;
  }
}

/**
 * Creates a statement AST node
 * @param {Object} declToken - Declaration token (@name)
 * @param {Object} subjectToken - Subject token
 * @param {Object} verbToken - Verb token
 * @param {Object} objectToken - Object token
 * @returns {Object} Statement AST
 */
function createStatementAST(declToken, subjectToken, verbToken, objectToken) {
  return {
    type: NodeType.STATEMENT,
    declaration: declToken.value,
    subject: subjectToken.value,
    verb: verbToken.value,
    object: objectToken.value,
    line: declToken.line,
    // Store token types for later semantic analysis
    subjectType: subjectToken.type,
    verbType: verbToken.type,
    objectType: objectToken.type
  };
}

/**
 * Creates a macro AST node
 * @param {string} name - Macro name (@Name)
 * @param {string} declarationType - 'theory' | 'verb' | 'session'
 * @param {Array} body - Array of statement ASTs
 * @param {Array} nestedMacros - Array of nested macro ASTs
 * @param {number} line - Line number
 * @returns {Object} Macro AST
 */
function createMacroAST(name, declarationType, body, nestedMacros, line) {
  return {
    type: NodeType.MACRO,
    name,
    declarationType,
    body,
    nestedMacros,
    line
  };
}

/**
 * Creates a script AST node
 * @param {Array} statements - Top-level statements
 * @param {Array} macros - Top-level macros
 * @returns {Object} Script AST
 */
function createScriptAST(statements, macros) {
  return {
    type: NodeType.SCRIPT,
    statements,
    macros
  };
}

/**
 * Parses a statement line (4 tokens)
 * @param {Array<Object>} lineTokens - Tokens for the line
 * @returns {Object} Statement AST
 * @throws {ParseError} If invalid statement
 */
function parseStatementLine(lineTokens) {
  if (lineTokens.length !== 4) {
    throw new ParseError(
      `Expected '@varName subject verb object', got ${lineTokens.length} tokens`,
      lineTokens[0]?.line || 0
    );
  }

  const [decl, subject, verb, object] = lineTokens;

  if (decl.type !== TokenType.DECLARATION) {
    throw new ParseError(
      `Statement must start with @declaration, got '${decl.value}'`,
      decl.line,
      decl.column
    );
  }

  return createStatementAST(decl, subject, verb, object);
}

/**
 * Parses a macro from grouped lines
 * @param {Array<Array<Object>>} lineGroups - Grouped tokens by line
 * @param {number} startIndex - Index of header line
 * @param {Set<string>} parentDeclarations - Declarations in parent scope
 * @returns {{macro: Object, endIndex: number}} Macro AST and end index
 * @throws {ParseError} If invalid macro
 */
function parseMacro(lineGroups, startIndex, parentDeclarations = new Set()) {
  const headerTokens = lineGroups[startIndex];

  // Validate header: @Name declarationType begin
  if (headerTokens.length !== 3) {
    throw new ParseError(
      `Expected '@MacroName declarationType begin'`,
      headerTokens[0].line
    );
  }

  const [nameToken, typeToken, beginToken] = headerTokens;

  if (nameToken.type !== TokenType.DECLARATION) {
    throw new ParseError(
      `Macro name must be @declaration, got '${nameToken.value}'`,
      nameToken.line,
      nameToken.column
    );
  }

  const validTypes = ['theory', 'verb', 'session'];
  const declType = typeToken.value.toLowerCase();
  if (!validTypes.includes(declType)) {
    throw new ParseError(
      `Invalid declarationType '${typeToken.value}', expected theory/verb/session`,
      typeToken.line,
      typeToken.column
    );
  }

  if (beginToken.value.toLowerCase() !== 'begin') {
    throw new ParseError(
      `Expected 'begin', got '${beginToken.value}'`,
      beginToken.line,
      beginToken.column
    );
  }

  // Parse body
  const body = [];
  const nestedMacros = [];
  const localDeclarations = new Set();
  let i = startIndex + 1;

  while (i < lineGroups.length) {
    const lineTokens = lineGroups[i];

    // Check for end
    if (isEndKeyword(lineTokens)) {
      return {
        macro: createMacroAST(
          nameToken.value,
          declType,
          body,
          nestedMacros,
          nameToken.line
        ),
        endIndex: i
      };
    }

    // Check for nested macro
    if (isMacroHeader(lineTokens)) {
      const nested = parseMacro(lineGroups, i, localDeclarations);
      nestedMacros.push(nested.macro);
      i = nested.endIndex + 1;
      continue;
    }

    // Must be a statement
    if (lineTokens.length === 4 && lineTokens[0].type === TokenType.DECLARATION) {
      const stmt = parseStatementLine(lineTokens);

      // SSA check: declaration must be unique within this macro
      if (localDeclarations.has(stmt.declaration)) {
        throw new ParseError(
          `Duplicate declaration '${stmt.declaration}' (SSA violation)`,
          stmt.line
        );
      }
      localDeclarations.add(stmt.declaration);

      body.push(stmt);
      i++;
      continue;
    }

    // Unknown line format
    throw new ParseError(
      `Invalid line: expected statement or macro`,
      lineTokens[0]?.line || 0
    );
  }

  // Reached end without finding 'end'
  throw new ParseError(
    `Unclosed macro '${nameToken.value}' starting at line ${nameToken.line}`,
    nameToken.line
  );
}

/**
 * Parses a complete DSL script
 * @param {string} text - DSL script text
 * @returns {Object} Script AST
 * @throws {ParseError} If parsing fails
 */
function parseScript(text) {
  const tokens = tokenizeScript(text);
  const lineGroups = groupByLine(tokens);

  const statements = [];
  const macros = [];
  const topLevelDeclarations = new Set();

  let i = 0;
  while (i < lineGroups.length) {
    const lineTokens = lineGroups[i];

    // Check for macro
    if (isMacroHeader(lineTokens)) {
      const result = parseMacro(lineGroups, i, topLevelDeclarations);
      macros.push(result.macro);
      i = result.endIndex + 1;
      continue;
    }

    // Check for standalone 'end' (error)
    if (isEndKeyword(lineTokens)) {
      throw new ParseError(
        `Unexpected 'end' without matching macro`,
        lineTokens[0].line
      );
    }

    // Check for statement
    if (lineTokens.length === 4 && lineTokens[0].type === TokenType.DECLARATION) {
      const stmt = parseStatementLine(lineTokens);

      if (topLevelDeclarations.has(stmt.declaration)) {
        throw new ParseError(
          `Duplicate declaration '${stmt.declaration}'`,
          stmt.line
        );
      }
      topLevelDeclarations.add(stmt.declaration);

      statements.push(stmt);
      i++;
      continue;
    }

    // Unknown line
    if (lineTokens.length > 0) {
      throw new ParseError(
        `Invalid line: expected statement or macro header`,
        lineTokens[0].line
      );
    }

    i++;
  }

  return createScriptAST(statements, macros);
}

/**
 * Validates a parsed AST for additional semantic rules
 * @param {Object} ast - Parsed AST
 * @throws {ParseError} If validation fails
 */
function validateAST(ast) {
  // Check verb macros have @result
  for (const macro of ast.macros) {
    if (macro.declarationType === 'verb') {
      const hasResult = macro.body.some(stmt => stmt.declaration === '@result');
      if (!hasResult) {
        throw new ParseError(
          `Verb macro '${macro.name}' must declare @result`,
          macro.line
        );
      }
    }
  }
}

/**
 * Parses and validates a DSL script
 * @param {string} text - DSL script text
 * @returns {Object} Validated Script AST
 */
function parse(text) {
  const ast = parseScript(text);
  validateAST(ast);
  return ast;
}

module.exports = {
  parse,
  parseScript,
  parseMacro,
  parseStatementLine,
  validateAST,
  ParseError,
  NodeType
};
