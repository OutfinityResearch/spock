/**
 * @fileoverview Theory storage - load, save, and manage theories on disk
 * @implements URS-005, URS-006, FS-04, DS Theory
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('../dsl/parser');
const { getConfig } = require('../config/config');

/**
 * Error for theory not found
 */
class TheoryNotFoundError extends Error {
  constructor(name) {
    super(`Theory not found: ${name}`);
    this.name = 'TheoryNotFoundError';
    this.theoryName = name;
  }
}

/**
 * Generates a unique version ID
 * @returns {string} Version ID
 */
function generateVersionId() {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets the theory directory path
 * @param {string} theoryName - Theory name
 * @returns {string} Directory path
 */
function getTheoryPath(theoryName) {
  const config = getConfig();
  return path.join(config.theoriesPath, theoryName);
}

/**
 * Creates a theory descriptor
 * @param {string} name - Theory name
 * @param {Object} ast - Parsed AST
 * @param {string} [versionId] - Version ID
 * @param {string|null} [parentVersionId] - Parent version
 * @returns {Object} Theory descriptor
 */
function createTheoryDescriptor(name, ast, versionId, parentVersionId = null) {
  return {
    name,
    versionId: versionId || generateVersionId(),
    parentVersionId,
    ast,
    vectors: new Map(),  // Cached prototype vectors
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Loads a theory from disk
 * @param {string} name - Theory name
 * @returns {Object} Theory descriptor
 * @throws {TheoryNotFoundError} If theory doesn't exist
 */
function loadTheory(name) {
  const theoryPath = getTheoryPath(name);

  // Check if directory exists
  if (!fs.existsSync(theoryPath)) {
    throw new TheoryNotFoundError(name);
  }

  // Read DSL file
  const dslPath = path.join(theoryPath, 'theory.spockdsl');
  if (!fs.existsSync(dslPath)) {
    throw new TheoryNotFoundError(name);
  }

  const dslText = fs.readFileSync(dslPath, 'utf8');
  const ast = parse(dslText);

  // Read metadata
  const metadataPath = path.join(theoryPath, 'metadata.json');
  let metadata = {
    versionId: generateVersionId(),
    parentVersionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }

  return {
    name,
    versionId: metadata.versionId,
    parentVersionId: metadata.parentVersionId,
    ast,
    vectors: new Map(),
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt
  };
}

/**
 * Saves a theory to disk
 * @param {Object} descriptor - Theory descriptor
 */
function saveTheory(descriptor) {
  const theoryPath = getTheoryPath(descriptor.name);

  // Create directory if needed
  if (!fs.existsSync(theoryPath)) {
    fs.mkdirSync(theoryPath, { recursive: true });
  }

  // Convert AST back to DSL text
  const dslText = astToText(descriptor.ast);

  // Write DSL file
  const dslPath = path.join(theoryPath, 'theory.spockdsl');
  fs.writeFileSync(dslPath, dslText, 'utf8');

  // Update and write metadata
  const metadata = {
    theoryId: descriptor.name,
    versionId: descriptor.versionId,
    parentVersionId: descriptor.parentVersionId,
    createdAt: descriptor.createdAt,
    updatedAt: new Date().toISOString()
  };

  const metadataPath = path.join(theoryPath, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
}

/**
 * Lists all available theories
 * @returns {Array<string>} Theory names
 */
function listTheories() {
  const config = getConfig();

  if (!fs.existsSync(config.theoriesPath)) {
    return [];
  }

  const entries = fs.readdirSync(config.theoriesPath, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

/**
 * Checks if a theory exists
 * @param {string} name - Theory name
 * @returns {boolean} True if exists
 */
function theoryExists(name) {
  const theoryPath = getTheoryPath(name);
  return fs.existsSync(theoryPath);
}

/**
 * Deletes a theory from disk
 * @param {string} name - Theory name
 * @returns {boolean} True if deleted
 */
function deleteTheory(name) {
  const theoryPath = getTheoryPath(name);

  if (!fs.existsSync(theoryPath)) {
    return false;
  }

  fs.rmSync(theoryPath, { recursive: true });
  return true;
}

/**
 * Converts AST back to DSL text
 * @param {Object} ast - Script AST
 * @returns {string} DSL text
 */
function astToText(ast) {
  const lines = [];

  // Top-level statements
  for (const stmt of ast.statements || []) {
    lines.push(statementToText(stmt));
  }

  // Macros
  for (const macro of ast.macros || []) {
    lines.push(macroToText(macro));
  }

  return lines.join('\n');
}

/**
 * Converts a statement AST to text
 * @param {Object} stmt - Statement AST
 * @returns {string} DSL statement
 */
function statementToText(stmt) {
  return `${stmt.declaration} ${stmt.subject} ${stmt.verb} ${stmt.object}`;
}

/**
 * Converts a macro AST to text
 * @param {Object} macro - Macro AST
 * @param {number} [indent=0] - Indentation level
 * @returns {string} DSL macro text
 */
function macroToText(macro, indent = 0) {
  const pad = '    '.repeat(indent);
  const lines = [];

  lines.push(`${pad}${macro.name} ${macro.declarationType} begin`);

  // Nested macros first
  for (const nested of macro.nestedMacros || []) {
    lines.push(macroToText(nested, indent + 1));
  }

  // Body statements
  for (const stmt of macro.body || []) {
    lines.push(`${pad}    ${statementToText(stmt)}`);
  }

  lines.push(`${pad}end`);

  return lines.join('\n');
}

/**
 * Ensures the theories directory exists
 */
function ensureTheoriesDirectory() {
  const config = getConfig();
  if (!fs.existsSync(config.theoriesPath)) {
    fs.mkdirSync(config.theoriesPath, { recursive: true });
  }
}

module.exports = {
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
};
