/**
 * @fileoverview High-level Session API facade
 * @implements URS-007, URS-008, FS-06, FS-07 (Dual Output Strategy)
 *
 * API Response Structure (per FS#7):
 * {
 *   success: boolean,
 *   score: number,           // Quick numeric indicator (truth/confidence)
 *   resultTheory: string,    // DSL: Clean conclusion only (for production)
 *   executionTrace: string   // DSL: Complete operation log (for eval/debug)
 * }
 */

'use strict';

const { parse } = require('../dsl/parser');
const { executeScript, createContext, executeEvaluate } = require('../dsl/executor');
const { startTrace, endTrace, registerSymbol, logKernelOp, markResult, traceToScript, traceToDetailedScript } = require('../logging/traceLogger');
const { buildSimpleResult, buildErrorResult, buildResultTheory } = require('./resultTheory');
const { getSymbol, createTypedValue } = require('../session/sessionManager');

/**
 * Creates an API wrapper around a session
 * @param {Object} session - Session from sessionManager
 * @returns {Object} SessionApi with high-level methods
 */
function createSessionApi(session) {
  /**
   * Executes a script and returns structured dual-output result
   * @param {string} script - DSL script
   * @param {string} method - API method name (for logging)
   * @returns {Object} ApiResult with resultTheory and executionTrace
   */
  function executeWithDualOutput(script, method) {
    const traceId = `${session.id}_${method}_${Date.now()}`;

    try {
      // Start execution trace
      startTrace(traceId);

      // Parse script
      const ast = parse(script);

      // Create execution context with trace integration
      const context = createContext(session, {
        traceId,
        onSymbolDefined: (name, value) => {
          registerSymbol(traceId, name, value.value || value);
        },
        onKernelOp: (verb, subject, object, result) => {
          logKernelOp(traceId, { verb, subject, object, result });
        }
      });

      // Execute
      const result = executeScript(ast, context);

      // Mark the final result
      if (result.symbols && result.symbols.has('@result')) {
        markResult(traceId, result.symbols.get('@result'));
      }

      // End trace and get snapshot
      const trace = endTrace(traceId);

      // Compute truth score
      const scores = computeScores(session);

      // Build result theory (clean output for production)
      // Use buildResultTheory to extract actual facts from trace (FS-07)
      const resultTheory = buildResultTheory(
        { result: result, symbols: result.symbols, scores },
        { trace, includeConfidence: true, includeMetadata: false }
      );

      // Build execution trace (detailed output for eval/debug)
      const executionTrace = traceToScript(trace);

      return {
        success: true,
        score: scores.truth,
        resultTheory,
        executionTrace,
        // Legacy fields for backward compatibility
        symbols: result.symbols,
        scores,
        trace,
        dslOutput: executionTrace  // Backward compatibility
      };
    } catch (error) {
      // End any active trace
      endTrace(traceId);

      // Build error result theory
      const resultTheory = buildErrorResult(error.message);

      return {
        success: false,
        score: 0,
        resultTheory,
        executionTrace: `# Error during execution\n# ${error.message}`,
        // Legacy fields
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
   * Legacy execute function for backward compatibility
   * @param {string} script - DSL script
   * @param {string} method - API method name
   * @returns {Object} ApiResult
   */
  function executeWithResult(script, method) {
    return executeWithDualOutput(script, method);
  }

  /**
   * Computes truth-related scores from session state using Evaluate verb
   * Uses explicit Evaluate projection onto Truth axis (per FS-02)
   * @param {Object} session - Session
   * @returns {Object} Scores with truth and confidence
   */
  function computeScores(session) {
    const truth = getSymbol(session, 'Truth');
    if (!truth || truth.type !== 'VECTOR') {
      return { truth: 0, confidence: 0, method: 'no_truth_vector' };
    }

    // Find the result vector: prefer @result, then $result, then last declared VECTOR
    let resultValue = null;
    let resultName = null;

    // Check for explicit @result first
    if (session.localSymbols.has('@result')) {
      const val = session.localSymbols.get('@result');
      if (val.type === 'VECTOR') {
        resultValue = val;
        resultName = '@result';
      }
    }

    // If no @result, check for $result
    if (!resultValue && session.localSymbols.has('$result')) {
      const val = session.localSymbols.get('$result');
      if (val.type === 'VECTOR') {
        resultValue = val;
        resultName = '$result';
      }
    }

    // Fallback: find last declared VECTOR
    if (!resultValue) {
      for (const [name, value] of session.localSymbols) {
        if (value.type === 'VECTOR') {
          resultValue = value;
          resultName = name;
        }
      }
    }

    if (!resultValue) {
      return { truth: 0, confidence: 0, method: 'no_result_vector' };
    }

    // Use executeEvaluate for explicit truth projection
    try {
      const context = createContext(session, {});
      const evaluateResult = executeEvaluate(resultValue, truth, context);

      // executeEvaluate returns SCALAR with truthScore in [0, 1]
      const truthScore = evaluateResult.value;

      // Confidence is derived from how far from 0.5 (neutral) the score is
      // Score of 0.5 = no alignment, 0 or 1 = strong alignment
      const confidence = Math.abs(truthScore - 0.5) * 2;

      return {
        truth: truthScore,
        confidence,
        method: 'evaluate',
        evaluatedSymbol: resultName
      };
    } catch (error) {
      // Fallback if Evaluate fails
      return {
        truth: 0,
        confidence: 0,
        method: 'evaluate_error',
        error: error.message
      };
    }
  }

  return {
    /**
     * Ingests facts and definitions
     * @param {string} script - DSL script with facts
     * @returns {Object} ApiResult with resultTheory and executionTrace
     */
    learn(script) {
      return executeWithDualOutput(script, 'learn');
    },

    /**
     * Queries for truth values
     * @param {string} script - DSL query script
     * @returns {Object} ApiResult with resultTheory and executionTrace
     */
    ask(script) {
      return executeWithDualOutput(script, 'ask');
    },

    /**
     * Constructs formal proofs
     * @param {string} script - DSL proof script
     * @returns {Object} ApiResult with resultTheory and executionTrace
     */
    prove(script) {
      return executeWithDualOutput(script, 'prove');
    },

    /**
     * Generates explanations
     * @param {string} script - DSL explain script
     * @returns {Object} ApiResult with resultTheory and executionTrace
     */
    explain(script) {
      return executeWithDualOutput(script, 'explain');
    },

    /**
     * Generates action sequences (planning)
     * @param {string} script - DSL plan script
     * @returns {Object} ApiResult with resultTheory and executionTrace
     */
    plan(script) {
      return executeWithDualOutput(script, 'plan');
    },

    /**
     * Finds constraint solutions
     * @param {string} script - DSL solve script
     * @returns {Object} ApiResult with resultTheory and executionTrace
     */
    solve(script) {
      return executeWithDualOutput(script, 'solve');
    },

    /**
     * Creates summaries
     * @param {string} script - DSL summarise script
     * @returns {Object} ApiResult with resultTheory and executionTrace
     */
    summarise(script) {
      return executeWithDualOutput(script, 'summarise');
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
    },

    /**
     * Direct access to executeWithDualOutput for custom scripts
     * @param {string} script - DSL script
     * @param {string} method - Method name for tracing
     * @returns {Object} ApiResult
     */
    execute(script, method = 'execute') {
      return executeWithDualOutput(script, method);
    }
  };
}

module.exports = {
  createSessionApi
};
