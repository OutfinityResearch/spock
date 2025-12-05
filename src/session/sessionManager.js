/**
 * @fileoverview Session management - create sessions, manage symbols and overlays
 * @implements URS-005, URS-006, FS-01, FS-04, DS Kernel
 */

'use strict';

const { getConfig } = require('../config/config');
const { loadTheory } = require('../theory/theoryStore');

/**
 * Generates a unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a typed value wrapper
 * @param {string} type - Value type (VECTOR, SCALAR, NUMERIC, MACRO)
 * @param {*} value - The actual value
 * @param {Object} [extra] - Extra properties (unit for NUMERIC, etc.)
 * @returns {Object} Typed value
 */
function createTypedValue(type, value, extra = {}) {
  return {
    type,
    value,
    ...extra
  };
}

/**
 * Creates a new session
 * @param {Array<string>} [initialTheories=[]] - Names of theories to overlay
 * @param {Object} [globalSymbols=null] - Global symbols (Truth, False, Zero)
 * @returns {Object} Session object
 */
function createSession(initialTheories = [], globalSymbols = null) {
  const session = {
    id: generateSessionId(),
    localSymbols: new Map(),
    overlays: [],
    globalSymbols: globalSymbols || new Map(),
    globals: globalSymbols || new Map(), // alias expected by tests
    createdAt: new Date(),
    config: getConfig()
  };

  // Load initial theories
  for (const theoryName of initialTheories) {
    try {
      const theory = loadTheory(theoryName);
      session.overlays.push(theory);
    } catch (e) {
      // Theory not found, skip silently or log warning
      console.warn(`Could not load theory: ${theoryName}`);
    }
  }

  return session;
}

/**
 * Resolves a symbol in session context
 * Resolution order: local -> overlays (LIFO) -> global
 *
 * @param {Object} session - Session object
 * @param {string} name - Symbol name (with or without @)
 * @returns {Object|undefined} Resolved typed value or undefined
 */
function getSymbol(session, name) {
  // Normalize name (add @ if missing for declarations)
  const normalizedName = name.startsWith('@') ? name : name;
  const withAt = normalizedName.startsWith('@') ? normalizedName : `@${normalizedName}`;

  // 1. Check local symbols first
  if (session.localSymbols.has(normalizedName)) {
    return session.localSymbols.get(normalizedName);
  }

  // Also check without @ prefix
  const withoutAt = normalizedName.startsWith('@') ? normalizedName.slice(1) : normalizedName;
  if (session.localSymbols.has(withoutAt)) {
    return session.localSymbols.get(withoutAt);
  }
  if (!normalizedName.startsWith('@') && session.localSymbols.has(withAt)) {
    return session.localSymbols.get(withAt);
  }

  // 2. Check overlays in reverse order (LIFO - most recent first)
  for (let i = session.overlays.length - 1; i >= 0; i--) {
    const theory = session.overlays[i] || {};

    // Direct symbol map on overlay
    if (theory.symbols && theory.symbols.has(normalizedName)) {
      return theory.symbols.get(normalizedName);
    }
    if (theory.symbols && theory.symbols.has(withoutAt)) {
      return theory.symbols.get(withoutAt);
    }
    if (!normalizedName.startsWith('@') && theory.symbols && theory.symbols.has(withAt)) {
      return theory.symbols.get(withAt);
    }

    // Check in theory's AST macros
    if (theory.ast && Array.isArray(theory.ast.macros)) {
      for (const macro of theory.ast.macros || []) {
        if (macro.name === normalizedName || macro.name === `@${withoutAt}`) {
          return createTypedValue('MACRO', macro);
        }

        // Check for verbs defined in the theory
        if (macro.declarationType === 'theory') {
          for (const nested of macro.nestedMacros || []) {
            if (nested.name === normalizedName || nested.name === `@${withoutAt}`) {
              return createTypedValue('MACRO', nested);
            }
          }
        }
      }
    }

    // Check cached vectors
    if (theory.vectors && theory.vectors.has(normalizedName)) {
      return theory.vectors.get(normalizedName);
    }
    if (!normalizedName.startsWith('@') && theory.vectors && theory.vectors.has(withAt)) {
      return theory.vectors.get(withAt);
    }
  }

  // 3. Check global symbols
  if (session.globalSymbols.has(normalizedName)) {
    return session.globalSymbols.get(normalizedName);
  }
  if (session.globalSymbols.has(withoutAt)) {
    return session.globalSymbols.get(withoutAt);
  }
  if (!normalizedName.startsWith('@') && session.globalSymbols.has(withAt)) {
    return session.globalSymbols.get(withAt);
  }

  return undefined;
}

/**
 * Sets a symbol in the local symbol table
 * @param {Object} session - Session object
 * @param {string} name - Symbol name
 * @param {Object} value - Typed value to bind
 */
function setSymbol(session, name, value) {
  if (value && typeof value === 'object' && !value.symbolName) {
    value.symbolName = name;
  }
  session.localSymbols.set(name, value);
}

/**
 * Checks if a symbol exists in session
 * @param {Object} session - Session object
 * @param {string} name - Symbol name
 * @returns {boolean} True if exists
 */
function hasSymbol(session, name) {
  return getSymbol(session, name) !== undefined;
}

/**
 * Adds a theory overlay to the session
 * @param {Object} session - Session object
 * @param {Object} theoryDescriptor - Theory to overlay
 */
function overlayTheory(session, theoryDescriptor) {
  session.overlays.push(theoryDescriptor);
}

/**
 * Removes the most recent theory overlay
 * @param {Object} session - Session object
 * @returns {Object|null} Removed theory or null
 */
function popOverlay(session) {
  return session.overlays.pop() || null;
}

/**
 * Gets all local symbol names
 * @param {Object} session - Session object
 * @returns {Array<string>} Symbol names
 */
function getLocalSymbolNames(session) {
  return Array.from(session.localSymbols.keys());
}

/**
 * Gets all available symbol names (local + overlays + global)
 * @param {Object} session - Session object
 * @returns {Set<string>} All symbol names
 */
function getAllSymbolNames(session) {
  const names = new Set();

  // Local
  for (const name of session.localSymbols.keys()) {
    names.add(name);
  }

  // Overlays
  for (const theory of session.overlays) {
    if (theory.symbols) {
      for (const name of theory.symbols.keys()) {
        names.add(name);
      }
    }
    if (theory.ast && theory.ast.macros) {
      for (const macro of theory.ast.macros || []) {
        names.add(macro.name);
      }
    }
  }

  // Global
  for (const name of session.globalSymbols.keys()) {
    names.add(name);
  }

  return Array.from(names);
}

/**
 * Clears all local symbols (session cleanup)
 * @param {Object} session - Session object
 */
function clearLocalSymbols(session) {
  session.localSymbols.clear();
}

/**
 * Creates a child session (for nested scopes)
 * @param {Object} parentSession - Parent session
 * @returns {Object} Child session
 */
function createChildSession(parentSession) {
  const child = {
    id: generateSessionId(),
    localSymbols: new Map(),
    overlays: [...parentSession.overlays],  // Share overlays
    globalSymbols: parentSession.globalSymbols,  // Share globals
    globals: parentSession.globalSymbols,
    parent: parentSession,
    createdAt: new Date(),
    config: parentSession.config
  };

  // Make parent locals visible via an overlay snapshot
  child.overlays.push({
    name: `parent:${parentSession.id}`,
    symbols: parentSession.localSymbols
  });

  return child;
}

/**
 * Gets statistics about a session
 * @param {Object} session - Session object
 * @returns {Object} Session stats
 */
function getSessionStats(session) {
  return {
    id: session.id,
    symbolCount: session.localSymbols.size,
    overlayCount: session.overlays.length,
    globalSymbolCount: session.globalSymbols.size,
    createdAt: session.createdAt
  };
}

module.exports = {
  createSession,
  getSymbol,
  setSymbol,
  hasSymbol,
  overlayTheory,
  popOverlay,
  getLocalSymbolNames,
  getAllSymbolNames,
  clearLocalSymbols,
  createChildSession,
  createTypedValue,
  getSessionStats
};
