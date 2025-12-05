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
function getTheoriesRoot() {
  const config = getConfig();
  const base = config.theoriesPath || path.join(config.workingFolder, 'theories');
  return path.isAbsolute(base) ? base : path.join(config.workingFolder, 'theories');
}

/**
 * Gets the directory path for a theory
 * @param {string} theoryName - Theory name
 * @returns {string} Directory path
 */
function getTheoryDir(theoryName) {
  return path.join(getTheoriesRoot(), theoryName);
}

/**
 * Gets the theory file path (theory.spockdsl)
 * @param {string} theoryName - Theory name
 * @returns {string} File path
 */
function getTheoryPath(theoryName) {
  return path.join(getTheoryDir(theoryName), 'theory.spockdsl');
}

/**
 * Creates a theory descriptor
 * @param {string} name - Theory name
 * @param {Object} ast - Parsed AST
 * @param {string} [versionId] - Version ID
 * @param {string|null} [parentVersionId] - Parent version
 * @returns {Object} Theory descriptor
 */
function createTheoryDescriptor(name, sourceOrAst, versionId, parentVersionId = null) {
  const isSourceString = typeof sourceOrAst === 'string';
  const source = isSourceString ? sourceOrAst : null;
  const ast = isSourceString ? parse(sourceOrAst) : sourceOrAst;

  return {
    name,
    versionId: versionId || generateVersionId(),
    parentVersionId,
    ast,
    source: source || astToText(ast),
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
  ensureTheoriesDirectory();
  const theoryFile = getTheoryPath(name);
  const theoryDir = getTheoryDir(name);

  if (!fs.existsSync(theoryFile)) {
    throw new TheoryNotFoundError(name);
  }

  const dslText = fs.readFileSync(theoryFile, 'utf8');
  const ast = parse(dslText);

  // Read metadata
  const metadataPath = path.join(theoryDir, 'metadata.json');
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
    source: dslText,
    vectors: new Map(),
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt
  };
}

/**
 * Saves a theory to disk
 * @param {Object} descriptor - Theory descriptor
 */
function saveTheory(descriptorOrName, source) {
  ensureTheoriesDirectory();
  const descriptor = typeof descriptorOrName === 'string'
    ? createTheoryDescriptor(descriptorOrName, source)
    : descriptorOrName;

  // Ensure we have AST and source
  let desc = descriptor;
  if (!desc.ast && desc.source) {
    desc = { ...desc, ast: parse(desc.source) };
  }
  if (!desc.source && desc.ast) {
    desc = { ...desc, source: astToText(desc.ast) };
  }

  const theoryDir = getTheoryDir(desc.name);
  if (!fs.existsSync(theoryDir)) {
    fs.mkdirSync(theoryDir, { recursive: true });
  }

  const dslText = desc.source || astToText(desc.ast);
  const dslPath = path.join(theoryDir, 'theory.spockdsl');
  fs.writeFileSync(dslPath, dslText, 'utf8');

  const metadata = {
    theoryId: desc.name,
    versionId: desc.versionId || generateVersionId(),
    parentVersionId: desc.parentVersionId || null,
    createdAt: desc.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const metadataPath = path.join(theoryDir, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

  return { ...desc, source: dslText, versionId: metadata.versionId, parentVersionId: metadata.parentVersionId };
}

/**
 * Lists all available theories
 * @returns {Array<string>} Theory names
 */
function listTheories() {
  const root = getTheoriesRoot();

  if (!fs.existsSync(root)) {
    return [];
  }

  const entries = fs.readdirSync(root, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .filter(e => fs.existsSync(path.join(root, e.name, 'theory.spockdsl')))
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
  const theoryDir = getTheoryDir(name);

  if (!fs.existsSync(theoryDir)) {
    return false;
  }

  fs.rmSync(theoryDir, { recursive: true });
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
  // Ensure declaration has @ prefix for valid DSL
  const decl = stmt.declaration.startsWith('@') ? stmt.declaration : `@${stmt.declaration}`;
  return `${decl} ${stmt.subject} ${stmt.verb} ${stmt.object}`;
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

  // Ensure macro name has @ prefix for valid DSL
  const name = macro.name.startsWith('@') ? macro.name : `@${macro.name}`;
  lines.push(`${pad}${name} ${macro.declarationType} begin`);

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
  const root = getTheoriesRoot();
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
}

/**
 * Seeds built-in theories from a source directory into the configured theories path.
 * Copies any subdirectory that contains a `theory.spockdsl` file.
 *
 * @param {string} builtinDir - Path to bundled theories
 * @returns {Array<string>} Names of seeded theories
 */
function seedBuiltinTheories(builtinDir) {
  const seeded = [];
  if (!builtinDir || !fs.existsSync(builtinDir)) {
    return seeded;
  }

  ensureTheoriesDirectory();

  const entries = fs.readdirSync(builtinDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const sourceDir = path.join(builtinDir, entry.name);
    const sourceTheoryFile = path.join(sourceDir, 'theory.spockdsl');

    if (!fs.existsSync(sourceTheoryFile)) {
      continue; // not a theory folder
    }

    const targetDir = path.join(getTheoriesRoot(), entry.name);

    if (!fs.existsSync(targetDir)) {
      // Copy entire folder (theory.spockdsl + metadata if present)
      fs.cpSync(sourceDir, targetDir, { recursive: true });
      seeded.push(entry.name);
    } else {
      // Already exists; still mark as available
      seeded.push(entry.name);
    }
  }

  return seeded;
}

module.exports = {
  loadTheory,
  saveTheory,
  listTheories,
  theoryExists,
  deleteTheory,
  createTheoryDescriptor,
  ensureTheoriesDirectory,
  getTheoriesRoot,
  getTheoryDir,
  seedBuiltinTheories,
  astToText,
  getTheoryPath,
  TheoryNotFoundError
};
