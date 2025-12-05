/**
 * @fileoverview Execution Trace Logger for DSL Explainability
 * @implements URS-008, FS-07 (Dual Output Strategy)
 *
 * Captures ALL kernel operations as a replayable DSL script.
 * This is the "Execution Trace" part of FS#7 Dual Output.
 *
 * Purpose:
 * - Testing (EvalSuite): Validates algorithm step-by-step
 * - Debugging: Shows exactly what operations happened
 * - Audit: Complete record of reasoning process
 *
 * Format: Linear DSL script with all intermediate operations:
 *   @step1 humans_vec Bind mortal_vec
 *   @step2 step1 Normalise
 *   @step3 socrates_vec Distance step2
 *   @result step3
 */

'use strict';

/**
 * Active traces storage
 * @type {Map<string, Object>}
 */
const activeTraces = new Map();

/**
 * Step counter per trace for unique naming
 * @type {Map<string, number>}
 */
const stepCounters = new Map();

function stripAt(name) {
  if (typeof name !== 'string') return name;
  return name.startsWith('@') ? name.slice(1) : name;
}

/**
 * Creates a kernel operation step
 * @param {string} stepId - Unique step identifier (@step1, @step2, etc.)
 * @param {string} verb - Kernel verb name (Add, Bind, Distance, etc.)
 * @param {string} subjectRef - Reference to subject (symbol name or @stepN)
 * @param {string|null} objectRef - Reference to object (or null for unary ops)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} KernelStep
 */
function createKernelStep(stepId, verb, subjectRef, objectRef, metadata = {}) {
  return {
    stepId,
    verb,
    subjectRef,
    objectRef,
    timestamp: Date.now(),
    metadata
  };
}

/**
 * Starts a new execution trace
 * @param {string} contextId - Unique context identifier (e.g., session ID + method)
 * @returns {Object} Trace object
 */
function startTrace(contextId) {
  const trace = {
    contextId,
    startTime: Date.now(),
    endTime: null,
    steps: [],
    symbolMap: new Map(),  // Maps internal values to symbol names
    status: 'active'
  };

  activeTraces.set(contextId, trace);
  stepCounters.set(contextId, 0);
  return trace;
}

/**
 * Registers a symbol for reference tracking
 * @param {string} contextId - Context identifier
 * @param {string} symbolName - The DSL symbol name
 * @param {*} value - The value (for matching in operations)
 */
function registerSymbol(contextId, symbolName, value) {
  const trace = activeTraces.get(contextId);
  if (!trace) return;

  // Store a reference key for matching (strip @ for operands)
  const key = getValueKey(value);
  if (key) {
    trace.symbolMap.set(key, stripAt(symbolName));
  }
}

/**
 * Generates a unique key for a value (for symbol matching)
 * @param {*} value - Any value
 * @returns {string|null} Key or null
 */
function getValueKey(value) {
  if (value === null || value === undefined) return null;

  if (ArrayBuffer.isView(value)) {
    // For typed arrays, use first few elements as key
    const preview = [];
    for (let i = 0; i < Math.min(5, value.length); i++) {
      preview.push(value[i].toFixed(4));
    }
    return `vec:${value.length}:${preview.join(',')}`;
  }

  if (typeof value === 'number') {
    return `num:${value.toFixed(6)}`;
  }

  if (typeof value === 'object' && value.type) {
    if (value.type === 'VECTOR' && value.value) {
      return getValueKey(value.value);
    }
    if (value.type === 'NUMERIC') {
      return `numeric:${value.value}:${value.unit || ''}`;
    }
  }

  return null;
}

/**
 * Finds the reference name for a value
 * @param {Object} trace - Trace object
 * @param {*} value - Value to find
 * @returns {string} Reference name (symbol name, @stepN, or 'anonymous')
 */
function findRef(trace, value) {
  const key = getValueKey(value);
  if (!key) return 'anonymous';

  // Check symbol map first
  if (trace.symbolMap.has(key)) {
    return stripAt(trace.symbolMap.get(key));
  }

  // Check previous step outputs
  for (let i = trace.steps.length - 1; i >= 0; i--) {
    const step = trace.steps[i];
    if (step.outputKey === key) {
      return stripAt(step.stepId);
    }
  }

  return 'anonymous';
}

/**
 * Logs a kernel operation
 * @param {string} contextId - Context identifier
 * @param {Object} operation - Operation details
 * @param {string} operation.verb - Kernel verb (Add, Bind, Distance, etc.)
 * @param {*} operation.subject - Subject value
 * @param {*} operation.object - Object value (optional)
 * @param {*} operation.result - Result value
 * @param {Object} operation.metadata - Additional info
 */
function logKernelOp(contextId, operation) {
  const trace = activeTraces.get(contextId);
  if (!trace || trace.status !== 'active') return;

  // Get next step ID
  const stepNum = stepCounters.get(contextId) + 1;
  stepCounters.set(contextId, stepNum);
  const stepId = `@step${stepNum}`;

  // Find references for subject and object
  const subjectRef = findRef(trace, operation.subject);
  const objectRef = operation.object !== undefined ? findRef(trace, operation.object) : null;

  // Create step
  const step = createKernelStep(stepId, operation.verb, subjectRef, objectRef, operation.metadata || {});

  // Store output key for future reference
  step.outputKey = getValueKey(operation.result);

  // Store raw values for detailed inspection
  step.rawSubject = summarizeValue(operation.subject);
  step.rawObject = operation.object !== undefined ? summarizeValue(operation.object) : null;
  step.rawResult = summarizeValue(operation.result);

  trace.steps.push(step);

  // Also register this step's output
  if (step.outputKey) {
    trace.symbolMap.set(step.outputKey, stripAt(stepId));
  }
}

/**
 * Marks a step as the final result
 * @param {string} contextId - Context identifier
 * @param {*} resultValue - The final result value
 */
function markResult(contextId, resultValue) {
  const trace = activeTraces.get(contextId);
  if (!trace) return;

  const ref = findRef(trace, resultValue);
  trace.resultRef = stripAt(ref);
}

/**
 * Ends a trace and returns immutable snapshot
 * @param {string} contextId - Context identifier
 * @returns {Object|null} Completed trace or null if not found
 */
function endTrace(contextId) {
  const trace = activeTraces.get(contextId);
  if (!trace) return null;

  trace.endTime = Date.now();
  trace.status = 'completed';
  trace.duration = trace.endTime - trace.startTime;

  // Create immutable snapshot (convert Map to object)
  const snapshot = {
    contextId: trace.contextId,
    startTime: trace.startTime,
    endTime: trace.endTime,
    duration: trace.duration,
    status: trace.status,
    steps: [...trace.steps],
    resultRef: trace.resultRef || null
  };

  // Clean up
  activeTraces.delete(contextId);
  stepCounters.delete(contextId);

  return Object.freeze(snapshot);
}

/**
 * Gets the current state of a trace (for inspection)
 * @param {string} contextId - Context identifier
 * @returns {Object|null} Trace or null
 */
function getTrace(contextId) {
  return activeTraces.get(contextId);
}

/**
 * Converts a trace to a replayable DSL script
 * This is the executionTrace output per FS#7
 *
 * @param {Object} trace - Completed trace
 * @returns {string} DSL script that reproduces the execution
 */
function traceToScript(trace) {
  if (!trace || !trace.steps || trace.steps.length === 0) {
    return '# No operations recorded';
  }

  const lines = [
    '# Execution Trace - All kernel operations',
    `# Context: ${trace.contextId}`,
    `# Duration: ${trace.duration}ms`,
    `# Steps: ${trace.steps.length}`,
    ''
  ];

  for (const step of trace.steps) {
    if (step.dslStatement) {
      lines.push(step.dslStatement);
      continue;
    }
    // Format: @stepN subject Verb object
    if (step.objectRef) {
      lines.push(`${step.stepId} ${stripAt(step.subjectRef)} ${step.verb} ${stripAt(step.objectRef)}`);
    } else {
      lines.push(`${step.stepId} ${stripAt(step.subjectRef)} ${step.verb} _`);
    }
  }

  // Add result marker
  if (trace.resultRef) {
    lines.push('');
    lines.push(`@result ${trace.resultRef}`);
  }

  return lines.join('\n');
}

/**
 * Converts trace to detailed format with values
 * @param {Object} trace - Completed trace
 * @returns {string} Detailed trace with values
 */
function traceToDetailedScript(trace) {
  if (!trace || !trace.steps || trace.steps.length === 0) {
    return '# No operations recorded';
  }

  const lines = [
    '# Detailed Execution Trace',
    `# Context: ${trace.contextId}`,
    `# Duration: ${trace.duration}ms`,
    ''
  ];

  for (const step of trace.steps) {
    // DSL line
    if (step.objectRef) {
      lines.push(`${step.stepId} ${step.subjectRef} ${step.verb} ${step.objectRef}`);
    } else {
      lines.push(`${step.stepId} ${step.subjectRef} ${step.verb} _`);
    }

    // Value comments
    lines.push(`  # subject: ${step.rawSubject}`);
    if (step.rawObject) {
      lines.push(`  # object: ${step.rawObject}`);
    }
    lines.push(`  # result: ${step.rawResult}`);
    lines.push('');
  }

  if (trace.resultRef) {
    lines.push(`@result ${trace.resultRef}`);
  }

  return lines.join('\n');
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
    return value.toFixed(6);
  }

  if (typeof value === 'string') {
    return value.length > 30 ? `"${value.substring(0, 30)}..."` : `"${value}"`;
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (ArrayBuffer.isView(value)) {
    // Compute norm for vectors
    let normSq = 0;
    for (let i = 0; i < value.length; i++) {
      normSq += value[i] * value[i];
    }
    const norm = Math.sqrt(normSq);

    const preview = [];
    for (let i = 0; i < Math.min(3, value.length); i++) {
      preview.push(value[i].toFixed(3));
    }
    const ellipsis = value.length > 3 ? '...' : '';
    return `Vector[${value.length}](${preview.join(', ')}${ellipsis}) norm=${norm.toFixed(4)}`;
  }

  if (value.type) {
    switch (value.type) {
      case 'VECTOR':
        return value.value ? summarizeValue(value.value) : 'VECTOR(empty)';
      case 'SCALAR':
        return `SCALAR(${(value.value || 0).toFixed(6)})`;
      case 'NUMERIC':
        return `NUMERIC(${value.value}${value.unit ? ' ' + value.unit : ''})`;
      case 'MEASURED':
        return `MEASURED(${value.value}${value.unit ? ' ' + value.unit : ''})`;
      default:
        return `${value.type}(...)`;
    }
  }

  if (Array.isArray(value)) {
    return `Array[${value.length}]`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
  }

  return String(value);
}

/**
 * Formats a trace step for display
 * @param {Object} step - Trace step
 * @returns {string} Formatted string
 */
function formatStep(step) {
  const dslLine = step.objectRef
    ? `${step.stepId} ${step.subjectRef} ${step.verb} ${step.objectRef}`
    : `${step.stepId} ${step.subjectRef} ${step.verb} _`;

  return `${dslLine}\n  subject: ${step.rawSubject}\n  ${step.rawObject ? `object: ${step.rawObject}\n  ` : ''}result: ${step.rawResult}`;
}

/**
 * Formats an entire trace for display
 * @param {Object} trace - Trace object
 * @returns {string} Formatted trace
 */
function formatTrace(trace) {
  if (!trace) return 'No trace';

  const lines = [
    `═══ Execution Trace: ${trace.contextId} ═══`,
    `Status: ${trace.status}`,
    `Duration: ${trace.duration}ms`,
    `Steps: ${trace.steps.length}`,
    '───────────────────────────────────────'
  ];

  for (const step of trace.steps) {
    lines.push(formatStep(step));
    lines.push('');
  }

  if (trace.resultRef) {
    lines.push(`@result ${trace.resultRef}`);
  }

  return lines.join('\n');
}

/**
 * Clears all active traces (for testing)
 */
function clearAll() {
  activeTraces.clear();
  stepCounters.clear();
}

// Legacy compatibility - these map to the old interface
function logStep(contextId, stepInfo) {
  const trace = activeTraces.get(contextId);
  if (!trace || trace.status !== 'active') return;

  const step = createTraceStep(
    trace.steps.length,
    stepInfo.dslStatement,
    stepInfo.inputs || {},
    stepInfo.output || {},
    {
      verb: stepInfo.verb,
      subject: stepInfo.subject,
      object: stepInfo.object
    }
  );

  trace.steps.push(step);
}

function createTraceStep(index, dslStatement, inputs, output, extra = {}) {
  return {
    index,
    dslStatement,
    timestamp: new Date().toISOString(),
    inputs,
    output,
    verb: extra.verb,
    subject: extra.subject,
    object: extra.object
  };
}

module.exports = {
  // New API (FS#7 compliant)
  startTrace,
  endTrace,
  getTrace,
  registerSymbol,
  logKernelOp,
  markResult,
  traceToScript,
  traceToDetailedScript,
  formatTrace,
  formatStep,
  summarizeValue,
  clearAll,

  // Legacy compatibility
  logStep,
  createTraceStep
};
