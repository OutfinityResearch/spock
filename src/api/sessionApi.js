/**
 * @fileoverview High-level Session API facade
 * @implements URS-007, URS-008, FS-06, FS-07, DS DSL
 */

'use strict';

const { parse } = require('../dsl/parser');
const { executeScript, createContext } = require('../dsl/executor');
const { traceToScript } = require('../logging/traceLogger');
const { cosineSimilarity } = require('../kernel/vectorSpace');
const { getSymbol } = require('../session/sessionManager');

/**
 * Creates an API wrapper around a session
 * @param {Object} session - Session from sessionManager
 * @returns {Object} SessionApi with high-level methods
 */
function createSessionApi(session) {
  /**
   * Executes a script and returns structured result
   * @param {string} script - DSL script
   * @param {string} method - API method name (for logging)
   * @returns {Object} ApiResult
   */
  function executeWithResult(script, method) {
    try {
      // Parse script
      const ast = parse(script);

      // Create execution context
      const context = createContext(session, {
        traceId: `${session.id}_${method}_${Date.now()}`
      });

      // Execute
      const result = executeScript(ast, context);

      // Compute truth score if possible
      const scores = computeScores(session);

      // Generate DSL output
      const dslOutput = traceToScript(result.trace);

      return {
        success: true,
        symbols: result.symbols,
        scores,
        trace: result.trace,
        dslOutput
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        line: error.line,
        symbols: new Map(),
        scores: { truth: 0, confidence: 0 },
        trace: null,
        dslOutput: ''
      };
    }
  }

  /**
   * Computes truth-related scores from session state
   * @param {Object} session - Session
   * @returns {Object} Scores
   */
  function computeScores(session) {
    const truth = getSymbol(session, 'Truth');
    if (!truth || truth.type !== 'VECTOR') {
      return { truth: 0, confidence: 0 };
    }

    // Find @result or last declared vector
    let resultVector = null;
    for (const [name, value] of session.localSymbols) {
      if (name === '@result' && value.type === 'VECTOR') {
        resultVector = value.value;
        break;
      }
      if (value.type === 'VECTOR') {
        resultVector = value.value;
      }
    }

    if (!resultVector) {
      return { truth: 0, confidence: 0 };
    }

    // Compute alignment with Truth
    const alignment = cosineSimilarity(resultVector, truth.value);
    const truthScore = (alignment + 1) / 2;  // Map [-1, 1] to [0, 1]

    return {
      truth: truthScore,
      confidence: Math.abs(alignment)  // Confidence is strength of alignment
    };
  }

  return {
    /**
     * Ingests facts and definitions
     * @param {string} script - DSL script with facts
     * @returns {Object} ApiResult
     */
    learn(script) {
      return executeWithResult(script, 'learn');
    },

    /**
     * Queries for truth values
     * @param {string} script - DSL query script
     * @returns {Object} ApiResult
     */
    ask(script) {
      return executeWithResult(script, 'ask');
    },

    /**
     * Constructs formal proofs
     * @param {string} script - DSL proof script
     * @returns {Object} ApiResult
     */
    prove(script) {
      return executeWithResult(script, 'prove');
    },

    /**
     * Generates explanations
     * @param {string} script - DSL explain script
     * @returns {Object} ApiResult
     */
    explain(script) {
      return executeWithResult(script, 'explain');
    },

    /**
     * Generates action sequences (planning)
     * @param {string} script - DSL plan script
     * @returns {Object} ApiResult
     */
    plan(script) {
      return executeWithResult(script, 'plan');
    },

    /**
     * Finds constraint solutions
     * @param {string} script - DSL solve script
     * @returns {Object} ApiResult
     */
    solve(script) {
      return executeWithResult(script, 'solve');
    },

    /**
     * Creates summaries
     * @param {string} script - DSL summarise script
     * @returns {Object} ApiResult
     */
    summarise(script) {
      return executeWithResult(script, 'summarise');
    },

    /**
     * Gets session statistics
     * @returns {Object} Stats
     */
    getStats() {
      return {
        sessionId: session.id,
        symbolCount: session.localSymbols.size,
        overlayCount: session.overlays.length
      };
    },

    /**
     * Gets the underlying session
     * @returns {Object} Session
     */
    getSession() {
      return session;
    }
  };
}

module.exports = {
  createSessionApi
};
