/**
 * @fileoverview Execution trace logging for DSL explainability
 * @implements URS-008, FS-07, DS DSL
 */

'use strict';

/**
 * Active traces storage
 * @type {Map<string, Object>}
 */
const activeTraces = new Map();

/**
 * Creates a trace step object
 * @param {number} index - Step number
 * @param {string} dslStatement - The DSL statement being executed
 * @param {Object} inputs - Input information
 * @param {Object} output - Output information
 * @returns {Object} TraceStep
 */
function createTraceStep(index, dslStatement, inputs, output) {
  return {
    index,
    dslStatement,
    timestamp: new Date().toISOString(),
    inputs,
    output
  };
}

/**
 * Starts a new trace for a context
 * @param {string} contextId - Unique context identifier (e.g., session ID)
 * @returns {Object} Trace object
 */
function startTrace(contextId) {
  const trace = {
    contextId,
    startTime: new Date().toISOString(),
    endTime: null,
    steps: [],
    status: 'active'
  };

  activeTraces.set(contextId, trace);
  return trace;
}

/**
 * Logs a single execution step
 * @param {string} contextId - Context identifier
 * @param {Object} stepInfo - Step information
 * @param {string} stepInfo.dslStatement - The DSL statement
 * @param {Object} stepInfo.inputs - Input values info
 * @param {Object} stepInfo.output - Output value info
 */
function logStep(contextId, stepInfo) {
  const trace = activeTraces.get(contextId);
  if (!trace) {
    // No active trace, silently ignore
    return;
  }

  if (trace.status !== 'active') {
    return;
  }

  const step = createTraceStep(
    trace.steps.length,
    stepInfo.dslStatement,
    stepInfo.inputs || {},
    stepInfo.output || {}
  );

  trace.steps.push(step);
}

/**
 * Ends a trace and returns immutable snapshot
 * @param {string} contextId - Context identifier
 * @returns {Object|null} Completed trace or null if not found
 */
function endTrace(contextId) {
  const trace = activeTraces.get(contextId);
  if (!trace) {
    return null;
  }

  trace.endTime = new Date().toISOString();
  trace.status = 'completed';

  // Create immutable copy
  const snapshot = JSON.parse(JSON.stringify(trace));

  // Clean up
  activeTraces.delete(contextId);

  return Object.freeze(snapshot);
}

/**
 * Gets the current state of a trace (for inspection)
 * @param {string} contextId - Context identifier
 * @returns {Object|null} Trace or null
 */
function getTrace(contextId) {
  return activeTraces.get(contextId) || null;
}

/**
 * Converts a trace to a replayable DSL script
 * @param {Object} trace - Completed trace
 * @returns {string} DSL script that reproduces the trace
 */
function traceToScript(trace) {
  if (!trace || !trace.steps) {
    return '';
  }

  return trace.steps
    .map(step => step.dslStatement)
    .join('\n');
}

/**
 * Formats a trace step for display
 * @param {Object} step - Trace step
 * @returns {string} Formatted string
 */
function formatStep(step) {
  const inputStr = Object.entries(step.inputs || {})
    .map(([k, v]) => `${k}=${summarizeValue(v)}`)
    .join(', ');

  const outputStr = summarizeValue(step.output);

  return `[${step.index}] ${step.dslStatement}\n    inputs: {${inputStr}}\n    output: ${outputStr}`;
}

/**
 * Summarizes a value for display
 * @param {*} value - Any value
 * @returns {string} Summary string
 */
function summarizeValue(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'number') {
    return value.toFixed(4);
  }

  if (typeof value === 'string') {
    return value.length > 20 ? value.substring(0, 20) + '...' : value;
  }

  if (value.type) {
    // Typed value
    switch (value.type) {
      case 'VECTOR':
        return `VECTOR[${value.value?.length || 0}]`;
      case 'SCALAR':
        return `SCALAR(${value.value?.toFixed(4) || 0})`;
      case 'NUMERIC':
        return `NUMERIC(${value.value}${value.unit ? ' ' + value.unit : ''})`;
      case 'MACRO':
        return `MACRO(${value.name || 'anonymous'})`;
      default:
        return `${value.type}(...)`;
    }
  }

  if (ArrayBuffer.isView(value)) {
    return `TypedArray[${value.length}]`;
  }

  if (Array.isArray(value)) {
    return `Array[${value.length}]`;
  }

  if (typeof value === 'object') {
    return '{...}';
  }

  return String(value);
}

/**
 * Formats an entire trace for display
 * @param {Object} trace - Trace object
 * @returns {string} Formatted trace
 */
function formatTrace(trace) {
  if (!trace) return 'No trace';

  const lines = [
    `Trace: ${trace.contextId}`,
    `Status: ${trace.status}`,
    `Started: ${trace.startTime}`,
    trace.endTime ? `Ended: ${trace.endTime}` : '',
    `Steps: ${trace.steps.length}`,
    '---'
  ];

  for (const step of trace.steps) {
    lines.push(formatStep(step));
  }

  return lines.filter(Boolean).join('\n');
}

/**
 * Clears all active traces (for testing)
 */
function clearAll() {
  activeTraces.clear();
}

module.exports = {
  startTrace,
  logStep,
  endTrace,
  getTrace,
  traceToScript,
  formatTrace,
  formatStep,
  summarizeValue,
  clearAll
};
