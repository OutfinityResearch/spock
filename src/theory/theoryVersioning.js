/**
 * @fileoverview Theory Versioning and Branching
 * @implements URS-005, FS-04, DS Theory
 *
 * Provides version control for theories:
 * - BranchTheory: Create a new branch from existing theory
 * - MergeTheory: Merge two theory branches
 * - UseTheory: Load a theory into session
 * - Remember: Persist session changes to theory
 *
 * Version model:
 * - Each theory has a versionId and optional parentVersionId
 * - Branches create new versions with same name prefix
 * - Merges combine symbols from two branches
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  loadTheory,
  saveTheory,
  createTheoryDescriptor,
  getTheoryPath,
  getTheoryDir,
  theoryExists,
  TheoryNotFoundError
} = require('./theoryStore');
const { getConfig } = require('../config/config');
const { parse } = require('../dsl/parser');
const vectorSpace = require('../kernel/vectorSpace');
const debug = require('../logging/debugLogger').theory;

/**
 * Conflict error for fail_on_conflict strategy
 */
class MergeConflictError extends Error {
  constructor(name, targetVersion, sourceVersion) {
    super(`Merge conflict on '${name}': exists in both target and source`);
    this.name = 'MergeConflictError';
    this.conflictName = name;
    this.targetVersion = targetVersion;
    this.sourceVersion = sourceVersion;
  }
}

/**
 * Generates a unique version ID
 * @returns {string}
 */
function generateVersionId() {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a branch name
 * @param {string} baseName - Base theory name
 * @param {string} branchName - Branch identifier
 * @returns {string}
 */
function generateBranchName(baseName, branchName) {
  return `${baseName}__${branchName}`;
}

/**
 * Parses a branch name to extract base and branch parts
 * @param {string} fullName - Full theory name
 * @returns {{base: string, branch: string|null}}
 */
function parseBranchName(fullName) {
  const parts = fullName.split('__');
  if (parts.length === 1) {
    return { base: parts[0], branch: null };
  }
  return { base: parts[0], branch: parts.slice(1).join('__') };
}

/**
 * Creates a branch from an existing theory
 *
 * @param {string} sourceName - Source theory name
 * @param {string} branchName - New branch identifier
 * @param {Object} options - Branch options
 * @returns {Object} New theory descriptor
 */
function branchTheory(sourceName, branchName, options = {}) {
  debug.enter('theoryVersioning', 'branchTheory', { sourceName, branchName });

  // Load source theory
  const source = loadTheory(sourceName);

  // Generate new branch name
  const newName = generateBranchName(sourceName, branchName);

  // Check if branch already exists
  if (theoryExists(newName)) {
    if (!options.overwrite) {
      throw new Error(`Branch already exists: ${newName}`);
    }
  }

  // Create new version with parent reference
  const newVersionId = generateVersionId();
  const branch = createTheoryDescriptor(
    newName,
    JSON.parse(JSON.stringify(source.ast)),  // Deep copy AST
    newVersionId,
    source.versionId  // Parent is source version
  );

  // Copy vectors if present (deep copy to avoid shared state)
  if (source.vectors) {
    branch.vectors = new Map();
    for (const [name, vec] of source.vectors) {
      // Deep copy Float32Array if present
      if (vec && vec.value && ArrayBuffer.isView(vec.value)) {
        branch.vectors.set(name, {
          ...vec,
          value: new Float32Array(vec.value)
        });
      } else {
        branch.vectors.set(name, { ...vec });
      }
    }
  }

  // Copy metadata
  branch.metadata = {
    ...source.metadata,
    branchedFrom: sourceName,
    branchedAt: new Date().toISOString()
  };

  // Save branch
  saveTheory(branch);

  debug.step('theoryVersioning', `Created branch ${newName} from ${sourceName}`);
  debug.exit('theoryVersioning', 'branchTheory', branch);

  return branch;
}

/**
 * Merges two theory branches
 *
 * Strategy:
 * - Statements from both branches are combined
 * - Conflicts (same declaration name) use strategy: 'target', 'source', or 'both'
 *
 * @param {string} targetName - Target branch name
 * @param {string} sourceName - Source branch name
 * @param {Object} options - Merge options
 * @returns {Object} Merged theory descriptor
 */
function mergeTheory(targetName, sourceName, options = {}) {
  debug.enter('theoryVersioning', 'mergeTheory', { targetName, sourceName });

  const conflictStrategy = options.conflictStrategy || 'target';  // 'target' | 'source' | 'both' | 'consensus' | 'fail'

  // Load both theories
  const target = loadTheory(targetName);
  const source = loadTheory(sourceName);

  // Create merged AST
  const mergedAst = {
    statements: [],
    macros: []
  };

  // Track declarations to detect conflicts
  const declarations = new Map();

  // Add target statements first
  for (const stmt of target.ast.statements || []) {
    declarations.set(stmt.declaration, { stmt, from: 'target' });
    mergedAst.statements.push(stmt);
  }

  // Add source statements, handling conflicts
  for (const stmt of source.ast.statements || []) {
    if (declarations.has(stmt.declaration)) {
      const existing = declarations.get(stmt.declaration);

      switch (conflictStrategy) {
        case 'source':
          // Replace with source
          const idx = mergedAst.statements.findIndex(s => s.declaration === stmt.declaration);
          if (idx >= 0) {
            mergedAst.statements[idx] = stmt;
          }
          break;

        case 'both':
          // Keep both (rename source)
          const renamedStmt = {
            ...stmt,
            declaration: `${stmt.declaration}_merged`
          };
          mergedAst.statements.push(renamedStmt);
          break;

        case 'fail':
          // Fail on conflict
          throw new MergeConflictError(stmt.declaration, target.versionId, source.versionId);

        case 'consensus':
          // For statements, keep both under merged name (vectors are averaged separately)
          const consensusStmt = {
            ...stmt,
            declaration: `${stmt.declaration}_consensus`
          };
          mergedAst.statements.push(consensusStmt);
          break;

        case 'target':
        default:
          // Keep target, ignore source
          break;
      }
    } else {
      declarations.set(stmt.declaration, { stmt, from: 'source' });
      mergedAst.statements.push(stmt);
    }
  }

  // Merge macros (verb and nested theory definitions)
  const macroNames = new Set();

  for (const macro of target.ast.macros || []) {
    macroNames.add(macro.name);
    mergedAst.macros.push(macro);
  }

  for (const macro of source.ast.macros || []) {
    if (!macroNames.has(macro.name)) {
      mergedAst.macros.push(macro);
    }
    // Skip duplicate macros (use target version)
  }

  // Create merged theory with new version
  const mergedVersionId = generateVersionId();
  const merged = createTheoryDescriptor(
    targetName,
    mergedAst,
    mergedVersionId,
    target.versionId  // Parent is target version
  );

  // Merge vectors from both theories
  merged.vectors = new Map();

  // Add target vectors first
  if (target.vectors) {
    for (const [name, vec] of target.vectors) {
      if (vec && vec.value && ArrayBuffer.isView(vec.value)) {
        merged.vectors.set(name, {
          ...vec,
          value: new Float32Array(vec.value),
          fromBranch: 'target'
        });
      } else {
        merged.vectors.set(name, { ...vec, fromBranch: 'target' });
      }
    }
  }

  // Add source vectors, handling conflicts
  if (source.vectors) {
    for (const [name, vec] of source.vectors) {
      if (merged.vectors.has(name)) {
        // Conflict: apply strategy
        switch (conflictStrategy) {
          case 'source':
            // Replace with source
            if (vec && vec.value && ArrayBuffer.isView(vec.value)) {
              merged.vectors.set(name, {
                ...vec,
                value: new Float32Array(vec.value),
                fromBranch: 'source'
              });
            } else {
              merged.vectors.set(name, { ...vec, fromBranch: 'source' });
            }
            break;

          case 'both':
            // Keep both: rename source vector
            const renamedName = `${name}_merged`;
            if (vec && vec.value && ArrayBuffer.isView(vec.value)) {
              merged.vectors.set(renamedName, {
                ...vec,
                value: new Float32Array(vec.value),
                fromBranch: 'source',
                originalName: name
              });
            } else {
              merged.vectors.set(renamedName, { ...vec, fromBranch: 'source', originalName: name });
            }
            break;

          case 'fail':
            // Fail on conflict
            throw new MergeConflictError(name, target.versionId, source.versionId);

          case 'consensus':
            // Geometric average: normalise(targetVec + sourceVec)
            const targetVec = merged.vectors.get(name);
            if (targetVec && targetVec.value && ArrayBuffer.isView(targetVec.value) &&
                vec && vec.value && ArrayBuffer.isView(vec.value)) {
              const sumVec = vectorSpace.addVectors(targetVec.value, vec.value);
              const consensusVec = vectorSpace.normalise(sumVec);
              merged.vectors.set(name, {
                type: targetVec.type || 'VECTOR',
                value: consensusVec,
                fromBranch: 'consensus',
                mergedFrom: ['target', 'source']
              });
            }
            // If not both vectors, keep target (fallback)
            break;

          case 'target':
          default:
            // Keep target, skip source
            break;
        }
      } else {
        // No conflict: add source vector
        if (vec && vec.value && ArrayBuffer.isView(vec.value)) {
          merged.vectors.set(name, {
            ...vec,
            value: new Float32Array(vec.value),
            fromBranch: 'source'
          });
        } else {
          merged.vectors.set(name, { ...vec, fromBranch: 'source' });
        }
      }
    }
  }

  // Record merge metadata
  merged.mergedFrom = {
    target: { name: targetName, version: target.versionId },
    source: { name: sourceName, version: source.versionId }
  };

  merged.metadata = {
    ...target.metadata,
    mergedAt: new Date().toISOString(),
    mergedSource: sourceName,
    conflictStrategy
  };

  // Save merged theory
  saveTheory(merged);

  debug.step('theoryVersioning', `Merged ${sourceName} into ${targetName}`);
  debug.exit('theoryVersioning', 'mergeTheory', merged);

  return merged;
}

/**
 * Loads a theory into a session (UseTheory verb)
 * Per FS-04: Executes the theory's statements to populate session symbols
 *
 * @param {Object} session - Session object
 * @param {string} theoryName - Theory to load
 * @param {Object} options - Load options
 * @param {function} [options.executeScript] - Executor function (injected to avoid circular dep)
 * @param {function} [options.createContext] - Context creator function
 * @returns {Object} Theory descriptor with execution result
 */
function useTheory(session, theoryName, options = {}) {
  debug.enter('theoryVersioning', 'useTheory', { sessionId: session.id, theoryName });

  // Load theory
  const theory = loadTheory(theoryName);

  // Add as overlay to session first (for symbol visibility)
  const overlay = {
    name: theoryName,
    versionId: theory.versionId,
    ast: theory.ast,
    symbols: new Map(),
    loadedAt: new Date().toISOString(),
    executed: false
  };

  session.overlays = session.overlays || [];
  session.overlays.push(overlay);

  // Execute theory statements if executor is provided
  // This populates the session with actual vectors from the theory
  if (options.executeScript && options.createContext && theory.ast) {
    debug.step('theoryVersioning', `Executing ${(theory.ast.statements || []).length} statements from ${theoryName}`);

    try {
      // Create context for execution
      const context = options.createContext(session, {
        theoryName,
        isTheoryLoad: true
      });

      // Execute the theory AST
      const execResult = options.executeScript(theory.ast, context);

      // Store executed symbols in overlay for tracking
      if (execResult && execResult.symbols) {
        for (const [name, value] of execResult.symbols) {
          overlay.symbols.set(name, value);
        }
      }

      overlay.executed = true;
      overlay.executedAt = new Date().toISOString();
      overlay.symbolCount = overlay.symbols.size;

      debug.step('theoryVersioning', `Executed theory ${theoryName}: ${overlay.symbolCount} symbols created`);
    } catch (error) {
      debug.step('theoryVersioning', `Error executing theory ${theoryName}: ${error.message}`);
      overlay.executionError = error.message;
    }
  } else {
    debug.step('theoryVersioning', `Theory ${theoryName} loaded but not executed (no executor provided)`);
  }

  debug.exit('theoryVersioning', 'useTheory', theory);

  return theory;
}

/**
 * Persists session changes to a theory (Remember verb)
 * Per FS-04: Preserves original relations, not just Identity declarations
 *
 * @param {Object} session - Session object
 * @param {string} theoryName - Target theory name
 * @param {Object} options - Save options
 * @returns {Object} Updated theory descriptor
 */
function rememberToTheory(session, theoryName, options = {}) {
  debug.enter('theoryVersioning', 'rememberToTheory', { sessionId: session.id, theoryName });

  const filter = options.filter || null;  // Optional: only save matching symbols
  const append = options.append !== false;  // Default: append to existing

  // Load existing theory or create new
  let theory;
  try {
    theory = loadTheory(theoryName);
  } catch (e) {
    if (e instanceof TheoryNotFoundError) {
      // Create new theory
      theory = createTheoryDescriptor(theoryName, { statements: [], macros: [] });
    } else {
      throw e;
    }
  }

  // Convert session symbols to AST statements
  // Preserving original relations from symbol metadata
  const newStatements = [];

  for (const [name, value] of session.localSymbols) {
    // Skip internal symbols
    if (name.startsWith('$') || name === '@result' || name.startsWith('@step')) continue;

    // Apply filter if provided
    if (filter && !filter(name, value)) continue;

    // Create statement from symbol, preserving original relation if available
    if (value.type === 'VECTOR' || value.type === 'MEASURED' || value.type === 'NUMERIC') {
      // Check if symbol has origin metadata (how it was created)
      if (value.origin && value.origin.verb && value.origin.object) {
        // Preserve original relation
        newStatements.push({
          declaration: name,
          subject: value.origin.subject || name,
          verb: value.origin.verb,
          object: value.origin.object,
          line: 0,
          preserved: true
        });
      } else if (value.source && value.source.statement) {
        // Preserve from source statement
        newStatements.push({
          ...value.source.statement,
          declaration: name,
          line: 0,
          preserved: true
        });
      } else {
        // Fallback: Create Identity declaration (for symbols without origin)
        // But record that this is a generated declaration
        newStatements.push({
          declaration: name,
          subject: name,
          verb: 'Identity',
          object: '_',
          line: 0,
          generated: true
        });
      }
    }

    // Handle FACT type directly
    if (value.type === 'FACT') {
      newStatements.push({
        declaration: name,
        subject: value.subject || name,
        verb: value.verb || 'Is',
        object: value.object || '_',
        line: 0,
        preserved: true
      });
    }
  }

  // Also preserve statements from loaded overlays that weren't modified
  for (const overlay of (session.overlays || [])) {
    if (overlay.ast && overlay.ast.statements) {
      for (const stmt of overlay.ast.statements) {
        // Check if this statement's declaration was modified in session
        const wasModified = newStatements.some(s => s.declaration === stmt.declaration);
        if (!wasModified) {
          // Preserve original statement from overlay
          newStatements.push({
            ...stmt,
            fromOverlay: overlay.name,
            preserved: true
          });
        }
      }
    }
  }

  // Update theory AST
  if (append) {
    // When appending, avoid duplicates by declaration name
    const existingDecls = new Set((theory.ast.statements || []).map(s => s.declaration));
    const uniqueNew = newStatements.filter(s => !existingDecls.has(s.declaration));
    theory.ast.statements = [...(theory.ast.statements || []), ...uniqueNew];
  } else {
    theory.ast.statements = newStatements;
  }

  // Bump version
  theory.parentVersionId = theory.versionId;
  theory.versionId = generateVersionId();
  theory.updatedAt = new Date().toISOString();

  // Save
  saveTheory(theory);

  debug.step('theoryVersioning', `Saved ${newStatements.length} symbols to ${theoryName} (${newStatements.filter(s => s.preserved).length} preserved)`);
  debug.exit('theoryVersioning', 'rememberToTheory', theory);

  return theory;
}

/**
 * Gets version history for a theory
 *
 * @param {string} theoryName - Theory name
 * @returns {Array} Version history chain
 */
function getVersionHistory(theoryName) {
  debug.enter('theoryVersioning', 'getVersionHistory', { theoryName });

  const history = [];
  const metadataPath = path.join(getTheoryDir(theoryName), 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    debug.exit('theoryVersioning', 'getVersionHistory', []);
    return [];
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  history.push({
    name: theoryName,
    versionId: metadata.versionId,
    parentVersionId: metadata.parentVersionId,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt
  });

  // Note: Full history traversal would require loading parent theories
  // This is a simplified version that returns only current metadata

  debug.exit('theoryVersioning', 'getVersionHistory', history);
  return history;
}

/**
 * Lists all branches of a theory
 *
 * @param {string} baseName - Base theory name
 * @returns {Array} Branch names
 */
function listBranches(baseName) {
  debug.enter('theoryVersioning', 'listBranches', { baseName });

  const config = getConfig();
  const theoriesDir = config.theoriesPath;

  if (!fs.existsSync(theoriesDir)) {
    debug.exit('theoryVersioning', 'listBranches', []);
    return [];
  }

  const entries = fs.readdirSync(theoriesDir, { withFileTypes: true });
  const branches = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name => {
      const parsed = parseBranchName(name);
      return parsed.base === baseName;
    });

  debug.exit('theoryVersioning', 'listBranches', branches);
  return branches;
}

/**
 * Theory versioning verb registry
 * Note: These receive context which includes session and optional executor references
 */
const THEORY_VERBS = {
  'UseTheory': (subject, object, context) => {
    const theoryName = getTheoryName(object);

    // Pass executor functions from context if available (FS-04: execute theory statements)
    const options = {};
    if (context.executeScript) {
      options.executeScript = context.executeScript;
    }
    if (context.createContext) {
      options.createContext = context.createContext;
    }

    return useTheory(context.session, theoryName, options);
  },

  'Remember': (subject, object, context) => {
    const theoryName = getTheoryName(object);
    return rememberToTheory(context.session, theoryName);
  },

  'BranchTheory': (subject, object, context) => {
    const sourceName = getTheoryName(subject);
    const branchName = getTheoryName(object);
    return branchTheory(sourceName, branchName);
  },

  'MergeTheory': (subject, object, context) => {
    const targetName = getTheoryName(subject);
    const sourceName = getTheoryName(object);
    return mergeTheory(targetName, sourceName);
  }
};

function getTheoryName(value) {
  if (typeof value === 'string') return value;
  if (!value) return '';
  if (value.type === 'STRING') return value.value;
  if (value.type === 'MACRO' && value.value?.name) {
    return value.value.name.replace(/^@/, '');
  }
  if (value.symbolName) return value.symbolName;
  if (value.name) return value.name;
  return String(value);
}

/**
 * Checks if a verb is a theory verb
 * @param {string} verbName
 * @returns {boolean}
 */
function isTheoryVerb(verbName) {
  return verbName in THEORY_VERBS;
}

/**
 * Gets a theory verb implementation
 * @param {string} verbName
 * @returns {function|null}
 */
function getTheoryVerb(verbName) {
  return THEORY_VERBS[verbName] || null;
}

module.exports = {
  branchTheory,
  mergeTheory,
  useTheory,
  rememberToTheory,
  getVersionHistory,
  listBranches,
  generateBranchName,
  parseBranchName,
  isTheoryVerb,
  getTheoryVerb,
  THEORY_VERBS,
  MergeConflictError
};
