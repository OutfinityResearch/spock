/**
 * @fileoverview DSL executor - runs parsed scripts and macros
 * @implements URS-004, URS-008, FS-01, FS-03, FS-07, DS DSL
 */

'use strict';

const { getExecutionOrder } = require('./dependencyGraph');
const { isKernelVerb, executeKernelVerb } = require('../kernel/primitiveOps');
const { isNumericVerb, getNumericVerb } = require('../kernel/numericKernel');
const vectorSpace = require('../kernel/vectorSpace');
const { getSymbol, setSymbol, createTypedValue, createChildSession } = require('../session/sessionManager');
const { startTrace, logStep, endTrace } = require('../logging/traceLogger');
const { getConfig } = require('../config/config');

/**
 * Execution error with context
 */
class ExecutionError extends Error {
  constructor(message, statement, context) {
    super(message);
    this.name = 'ExecutionError';
    this.statement = statement;
    this.line = statement?.line;
  }
}

/**
 * Creates an execution context
 * @param {Object} session - Session object
 * @param {Object} [options] - Additional options
 * @returns {Object} Execution context
 */
function createContext(session, options = {}) {
  return {
    session,
    config: getConfig(),
    traceId: options.traceId || session.id,
    recursionDepth: 0,
    maxRecursion: options.maxRecursion || getConfig().maxRecursion
  };
}

/**
 * Resolves a symbol from the context
 * @param {string} name - Symbol name
 * @param {Object} context - Execution context
 * @returns {Object} Typed value
 * @throws {ExecutionError} If symbol not found and not auto-generatable
 */
function resolveSymbol(name, context) {
  // Check for placeholder
  if (name === '_') {
    return createTypedValue('VECTOR', vectorSpace.createVector());
  }

  // Check for magic variables (handled by caller in verb execution)
  if (name.startsWith('$')) {
    throw new ExecutionError(`Magic variable ${name} used outside verb macro`, null);
  }

  // Check for numeric literal
  if (/^-?\d+(\.\d+)?$/.test(name)) {
    return createTypedValue('SCALAR', parseFloat(name));
  }

  // Try to resolve from session
  const resolved = getSymbol(context.session, name);
  if (resolved) {
    return resolved;
  }

  // Auto-generate new concept vector for unknown identifiers
  const newVector = vectorSpace.createRandomVector();
  const typedValue = createTypedValue('VECTOR', newVector);

  // Store for future reference
  setSymbol(context.session, name, typedValue);

  return typedValue;
}

/**
 * Resolves a verb (kernel, numeric, or user-defined)
 * @param {string} verbName - Verb name
 * @param {Object} context - Execution context
 * @returns {Object} Verb info {type, fn/macro}
 */
function resolveVerb(verbName, context) {
  // Check kernel verbs
  if (isKernelVerb(verbName)) {
    return { type: 'kernel', name: verbName };
  }

  // Check numeric verbs
  if (isNumericVerb(verbName)) {
    return { type: 'numeric', name: verbName };
  }

  // Check for user-defined verb macro in session
  const macro = getSymbol(context.session, verbName);
  if (macro && macro.type === 'MACRO' && macro.value.declarationType === 'verb') {
    return { type: 'macro', macro: macro.value };
  }

  // Also try with @ prefix
  const macroWithAt = getSymbol(context.session, `@${verbName}`);
  if (macroWithAt && macroWithAt.type === 'MACRO' && macroWithAt.value.declarationType === 'verb') {
    return { type: 'macro', macro: macroWithAt.value };
  }

  // Unknown verb - treat as binding operation
  return { type: 'kernel', name: 'Bind' };
}

/**
 * Executes a kernel verb
 * @param {string} verbName - Verb name
 * @param {Object} subject - Subject typed value
 * @param {Object} object - Object typed value
 * @returns {Object} Result typed value
 */
function executeKernel(verbName, subject, object) {
  const subjectVal = subject.value;
  const objectVal = object.type === 'SCALAR' ? object.value : object.value;

  const result = executeKernelVerb(verbName, subjectVal, objectVal);

  // Determine result type
  if (typeof result === 'number') {
    return createTypedValue('SCALAR', result);
  }
  return createTypedValue('VECTOR', result);
}

/**
 * Executes a numeric verb
 * @param {string} verbName - Verb name
 * @param {Object} subject - Subject typed value
 * @param {Object} object - Object typed value
 * @returns {Object} Result typed value
 */
function executeNumeric(verbName, subject, object) {
  const fn = getNumericVerb(verbName);
  if (!fn) {
    throw new ExecutionError(`Unknown numeric verb: ${verbName}`, null);
  }

  // Special handling for HasNumericValue
  if (verbName === 'HasNumericValue') {
    const numValue = subject.type === 'SCALAR' ? subject.value :
                     typeof subject === 'number' ? subject :
                     parseFloat(String(subject.value || subject));
    return fn(numValue, object);
  }

  return fn(subject, object);
}

/**
 * Executes a user-defined verb macro
 * @param {Object} verbMacro - Verb macro AST
 * @param {Object} subject - Subject typed value
 * @param {Object} object - Object typed value
 * @param {Object} context - Execution context
 * @returns {Object} Result typed value (@result)
 */
function executeVerbMacro(verbMacro, subject, object, context) {
  // Check recursion limit
  if (context.recursionDepth >= context.maxRecursion) {
    throw new ExecutionError(`Maximum recursion depth exceeded`, null);
  }

  // Create child context for verb execution
  const childSession = createChildSession(context.session);

  // Bind magic variables
  setSymbol(childSession, '$subject', subject);
  setSymbol(childSession, '$object', object);

  const childContext = {
    ...context,
    session: childSession,
    recursionDepth: context.recursionDepth + 1
  };

  // Execute verb body in topological order
  const executionOrder = getExecutionOrder(verbMacro);

  for (const stmt of executionOrder) {
    executeStatement(stmt, childContext);
  }

  // Return @result
  const result = getSymbol(childSession, '@result');
  if (!result) {
    throw new ExecutionError(`Verb macro ${verbMacro.name} did not produce @result`, null);
  }

  return result;
}

/**
 * Executes a single statement
 * @param {Object} stmt - Statement AST
 * @param {Object} context - Execution context
 * @returns {Object} Result typed value
 */
function executeStatement(stmt, context) {
  // Resolve subject
  let subject;
  if (stmt.subject.startsWith('$')) {
    subject = getSymbol(context.session, stmt.subject);
    if (!subject) {
      throw new ExecutionError(`Unbound magic variable: ${stmt.subject}`, stmt);
    }
  } else {
    subject = resolveSymbol(stmt.subject, context);
  }

  // Resolve object
  let object;
  if (stmt.object.startsWith('$')) {
    object = getSymbol(context.session, stmt.object);
    if (!object) {
      throw new ExecutionError(`Unbound magic variable: ${stmt.object}`, stmt);
    }
  } else {
    object = resolveSymbol(stmt.object, context);
  }

  // Resolve and execute verb
  const verb = resolveVerb(stmt.verb, context);
  let result;

  switch (verb.type) {
    case 'kernel':
      result = executeKernel(verb.name, subject, object);
      break;

    case 'numeric':
      result = executeNumeric(verb.name, subject, object);
      break;

    case 'macro':
      result = executeVerbMacro(verb.macro, subject, object, context);
      break;

    default:
      throw new ExecutionError(`Unknown verb type: ${verb.type}`, stmt);
  }

  // Store result
  setSymbol(context.session, stmt.declaration, result);

  // Log trace step
  logStep(context.traceId, {
    dslStatement: `${stmt.declaration} ${stmt.subject} ${stmt.verb} ${stmt.object}`,
    inputs: {
      subject: stmt.subject,
      verb: stmt.verb,
      object: stmt.object
    },
    output: {
      declaration: stmt.declaration,
      type: result.type
    }
  });

  return result;
}

/**
 * Executes a macro (theory, verb, or session)
 * @param {Object} macro - Macro AST
 * @param {Object} context - Execution context
 * @returns {Object} Execution result
 */
function executeMacro(macro, context) {
  switch (macro.declarationType) {
    case 'theory':
      // Register theory definitions
      setSymbol(context.session, macro.name, createTypedValue('MACRO', macro));

      // Register nested verb definitions
      for (const nested of macro.nestedMacros || []) {
        setSymbol(context.session, nested.name, createTypedValue('MACRO', nested));
      }

      // Execute body statements (facts)
      const theoryOrder = getExecutionOrder(macro);
      for (const stmt of theoryOrder) {
        executeStatement(stmt, context);
      }
      break;

    case 'verb':
      // Just register the verb, don't execute
      setSymbol(context.session, macro.name, createTypedValue('MACRO', macro));
      break;

    case 'session':
      // Create child session and execute
      const sessionContext = {
        ...context,
        session: createChildSession(context.session)
      };

      // Execute nested macros first (theories, verbs)
      for (const nested of macro.nestedMacros || []) {
        executeMacro(nested, sessionContext);
      }

      // Execute body
      const sessionOrder = getExecutionOrder(macro);
      for (const stmt of sessionOrder) {
        executeStatement(stmt, sessionContext);
      }
      break;
  }

  return { success: true };
}

/**
 * Executes a complete script
 * @param {Object} ast - Script AST
 * @param {Object} context - Execution context
 * @returns {Object} Execution result with symbols and trace
 */
function executeScript(ast, context) {
  // Start trace
  startTrace(context.traceId);

  try {
    // Process macros first
    for (const macro of ast.macros || []) {
      executeMacro(macro, context);
    }

    // Execute top-level statements
    for (const stmt of ast.statements || []) {
      executeStatement(stmt, context);
    }

    // End trace
    const trace = endTrace(context.traceId);

    return {
      success: true,
      symbols: context.session.localSymbols,
      trace
    };
  } catch (error) {
    endTrace(context.traceId);
    throw error;
  }
}

module.exports = {
  executeScript,
  executeMacro,
  executeStatement,
  executeVerbMacro,
  createContext,
  resolveSymbol,
  resolveVerb,
  ExecutionError
};
