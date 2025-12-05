/**
 * @fileoverview DSL executor - runs parsed scripts and macros
 * @implements URS-004, URS-008, FS-01, FS-02, FS-03, FS-07, DS DSL
 *
 * Integrates:
 * - Kernel verbs (Add, Bind, Distance, etc.)
 * - Numeric verbs (AddNumeric, etc.)
 * - Planning verbs (Plan, Solve)
 * - Theory verbs (UseTheory, Remember, BranchTheory, MergeTheory)
 * - Evaluate verb for truth projection
 */

'use strict';

const { getExecutionOrder } = require('./dependencyGraph');
const { isKernelVerb, executeKernelVerb } = require('../kernel/primitiveOps');
const { isNumericVerb, getNumericVerb } = require('../kernel/numericKernel');
const { isPlanningVerb, getPlanningVerb } = require('../planning/planner');
const { isTheoryVerb, getTheoryVerb } = require('../theory/theoryVersioning');
const vectorSpace = require('../kernel/vectorSpace');
const { getSymbol, setSymbol, createTypedValue, createChildSession } = require('../session/sessionManager');
const { startTrace, logStep, endTrace, logKernelOp, registerSymbol, getTrace } = require('../logging/traceLogger');
const { getConfig } = require('../config/config');
const debug = require('../logging/debugLogger').dsl;

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
 * Persist verb - stores the subject under the given object name in the session
 * @param {Object} subject - Typed value to persist
 * @param {Object} object - Name (STRING or identifier)
 * @param {Object} context - Execution context
 * @returns {Object} The persisted value
 */
function executePersist(subject, object, context) {
  debug.enter('executor', 'executePersist', { object });
  const name = object.type === 'STRING' ? object.value : String(object.symbolName || object.value || object);
  setSymbol(context.session, name, subject);
  debug.exit('executor', 'executePersist', subject);
  return subject;
}

/**
 * Describe verb - attaches a human-friendly description/anchor to a value
 * without renaming it. Returns the same value enriched with metadata.
 * @param {Object} subject - Typed value to describe
 * @param {Object} object - Anchor name or identifier
 * @param {Object} context - Execution context
 * @returns {Object} Described value (same type/value)
 */
function executeDescribe(subject, object, context) {
  debug.enter('executor', 'executeDescribe', { object });
  const anchor =
    object.type === 'STRING'
      ? object.value
      : String(object.symbolName || object.value || object);

  // Clone subject to avoid mutation
  const described = {
    ...subject,
    describedAs: anchor
  };

  debug.exit('executor', 'executeDescribe', described);
  return described;
}
/**
 * Type validation error
 */
class TypeError extends ExecutionError {
  constructor(expected, actual, verbName, operand) {
    super(`${verbName} requires ${expected} for ${operand}, got ${actual}`);
    this.name = 'TypeError';
    this.expected = expected;
    this.actual = actual;
  }
}

/**
 * Unknown verb error
 */
class UnknownVerbError extends ExecutionError {
  constructor(verbName, statement) {
    super(`Unknown verb: ${verbName}. Available verbs: kernel (Add, Bind, etc.), numeric (AddNumeric, etc.), planning (Plan, Solve), theory (UseTheory, Remember, BranchTheory, MergeTheory)`, statement);
    this.name = 'UnknownVerbError';
    this.verbName = verbName;
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
    maxRecursion: options.maxRecursion || getConfig().maxRecursion,
    onSymbolDefined: options.onSymbolDefined || null,
    onKernelOp: options.onKernelOp || null
  };
}

/**
 * Validates operand type for a verb
 * @param {Object} value - Typed value
 * @param {string[]} allowedTypes - Allowed type names
 * @param {string} verbName - Verb name for error
 * @param {string} operandName - 'subject' or 'object'
 * @throws {TypeError} If type mismatch
 */
function validateType(value, allowedTypes, verbName, operandName) {
  if (!allowedTypes.includes(value.type)) {
    throw new TypeError(allowedTypes.join('|'), value.type, verbName, operandName);
  }
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

  // Reference to prior declaration uses $name -> lookup @name
  if (name.startsWith('$')) {
    const base = name.slice(1);
    const withAt = `@${base}`;
    const resolvedRef =
      getSymbol(context.session, name) ||
      getSymbol(context.session, withAt) ||
      getSymbol(context.session, base);
    if (resolvedRef) {
      return resolvedRef;
    }
    throw new ExecutionError(`Unknown reference ${name}`, null);
  }

  // Check for magic variables (handled by caller in verb execution)
  // (handled above for $ references)

  // Check for numeric literal
  if (/^-?\d+(\.\d+)?$/.test(name)) {
    return createTypedValue('SCALAR', parseFloat(name));
  }

  // Check for string literal
  if (name.startsWith('"') && name.endsWith('"')) {
    return createTypedValue('STRING', name.slice(1, -1));
  }

  // Try to resolve from session
  const resolved = getSymbol(context.session, name);
  if (resolved) {
    return resolved;
  }

  // Auto-generate new concept vector for unknown identifiers
  debug.step('executor', `Auto-generating vector for unknown symbol: ${name}`);
  const newVector = vectorSpace.createRandomVector();
  const typedValue = createTypedValue('VECTOR', newVector, { symbolName: name });

  // Store for future reference
  setSymbol(context.session, name, typedValue);

  // Notify if callback set
  if (context.onSymbolDefined) {
    context.onSymbolDefined(name, typedValue);
  }

  return typedValue;
}

/**
 * Resolves a verb (kernel, numeric, planning, theory, or user-defined)
 * @param {string} verbName - Verb name
 * @param {Object} context - Execution context
 * @returns {Object} Verb info {type, fn/macro}
 * @throws {UnknownVerbError} If verb not found
 */
function resolveVerb(verbName, context) {
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

  // Check kernel verbs (Add, Bind, Negate, Distance, Move, Modulate, Identity, Normalise)
  if (isKernelVerb(verbName)) {
    return { type: 'kernel', name: verbName };
  }

  // Check numeric verbs (HasNumericValue, AttachUnit, AddNumeric, etc.)
  if (isNumericVerb(verbName)) {
    return { type: 'numeric', name: verbName };
  }

  // Check planning verbs (Plan, Solve)
  if (isPlanningVerb(verbName)) {
    return { type: 'planning', name: verbName };
  }

  // Check theory verbs (UseTheory, Remember, BranchTheory, MergeTheory)
  if (isTheoryVerb(verbName)) {
    return { type: 'theory', name: verbName };
  }

  // Persist verb to pin a value in session
  if (verbName === 'Persist') {
    return { type: 'persist', name: 'Persist' };
  }

  // Describe verb to attach human-readable anchor
  if (verbName === 'Describe') {
    return { type: 'describe', name: 'Describe' };
  }

  // Check for Evaluate verb (truth projection)
  if (verbName === 'Evaluate') {
    return { type: 'evaluate', name: 'Evaluate' };
  }

  // Unknown verb - throw error (no more silent Bind fallback)
  throw new UnknownVerbError(verbName, null);
}

/**
 * Executes a kernel verb with type checking
 * @param {string} verbName - Verb name
 * @param {Object} subject - Subject typed value
 * @param {Object} object - Object typed value
 * @param {Object} context - Execution context
 * @returns {Object} Result typed value
 */
function executeKernel(verbName, subject, object, context) {
  debug.enter('executor', 'executeKernel', { verbName });

  // Type checking for kernel verbs
  const vectorVerbs = ['Add', 'Bind', 'Move', 'Distance'];
  const unaryVerbs = ['Negate', 'Identity', 'Normalise'];
  const polymorphicVerbs = ['Modulate'];

  if (vectorVerbs.includes(verbName)) {
    validateType(subject, ['VECTOR'], verbName, 'subject');
    validateType(object, ['VECTOR'], verbName, 'object');
  } else if (unaryVerbs.includes(verbName)) {
    validateType(subject, ['VECTOR'], verbName, 'subject');
  } else if (polymorphicVerbs.includes(verbName)) {
    validateType(subject, ['VECTOR'], verbName, 'subject');
    validateType(object, ['VECTOR', 'SCALAR'], verbName, 'object');
  }

  const subjectVal = subject.value;
  const objectVal = object.type === 'SCALAR' ? object.value : object.value;

  const result = executeKernelVerb(verbName, subjectVal, objectVal);

  // Log to trace
  if (context.onKernelOp) {
    context.onKernelOp(verbName, subjectVal, objectVal, result);
  }

  // Determine result type
  let typedResult;
  if (typeof result === 'number') {
    typedResult = createTypedValue('SCALAR', result);
  } else {
    typedResult = createTypedValue('VECTOR', result);
  }

  debug.exit('executor', 'executeKernel', typedResult);
  return typedResult;
}

/**
 * Executes a numeric verb
 * @param {string} verbName - Verb name
 * @param {Object} subject - Subject typed value
 * @param {Object} object - Object typed value
 * @param {Object} context - Execution context
 * @returns {Object} Result typed value
 */
function executeNumeric(verbName, subject, object, context) {
  debug.enter('executor', 'executeNumeric', { verbName });

  const fn = getNumericVerb(verbName);
  if (!fn) {
    throw new ExecutionError(`Unknown numeric verb: ${verbName}`, null);
  }

  // Special handling for HasNumericValue
  if (verbName === 'HasNumericValue') {
    const numValue = subject.type === 'SCALAR' ? subject.value :
                     typeof subject === 'number' ? subject :
                     parseFloat(String(subject.value || subject));
    const result = fn(numValue, object, context);
    debug.exit('executor', 'executeNumeric', result);
    return result;
  }

  // Type checking for numeric verbs
  if (['AddNumeric', 'SubNumeric', 'MulNumeric', 'DivNumeric'].includes(verbName)) {
    validateType(subject, ['NUMERIC'], verbName, 'subject');
    validateType(object, ['NUMERIC'], verbName, 'object');
  }

  // Type checking for AttachToConcept
  if (verbName === 'AttachToConcept') {
    validateType(subject, ['NUMERIC'], verbName, 'subject');
    // object can be VECTOR or string
  }

  // Type checking for ProjectNumeric
  if (verbName === 'ProjectNumeric') {
    // subject can be MEASURED, NUMERIC, or VECTOR
    // object is property name or NUMERIC
  }

  // Pass context to all numeric verbs for property lookup
  const result = fn(subject, object, context);
  debug.exit('executor', 'executeNumeric', result);
  return result;
}

/**
 * Executes a planning verb
 * @param {string} verbName - Verb name
 * @param {Object} subject - Subject typed value
 * @param {Object} object - Object typed value
 * @param {Object} context - Execution context
 * @returns {Object} Result typed value
 */
function executePlanning(verbName, subject, object, context) {
  debug.enter('executor', 'executePlanning', { verbName });

  const fn = getPlanningVerb(verbName);
  if (!fn) {
    throw new ExecutionError(`Unknown planning verb: ${verbName}`, null);
  }

  // Type checking
  validateType(subject, ['VECTOR'], verbName, 'subject');
  validateType(object, ['VECTOR'], verbName, 'object');

  const result = fn(subject, object, context);
  debug.exit('executor', 'executePlanning', result);
  return result;
}

/**
 * Executes a theory verb
 * @param {string} verbName - Verb name
 * @param {Object} subject - Subject typed value
 * @param {Object} object - Object typed value
 * @param {Object} context - Execution context
 * @returns {Object} Result typed value
 */
function executeTheory(verbName, subject, object, context) {
  debug.enter('executor', 'executeTheory', { verbName });

  const fn = getTheoryVerb(verbName);
  if (!fn) {
    throw new ExecutionError(`Unknown theory verb: ${verbName}`, null);
  }

  const result = fn(subject, object, context);

  // Convert to typed value if needed
  let typedResult = result;
  if (!result.type) {
    typedResult = createTypedValue('THEORY', result);
  }

  debug.exit('executor', 'executeTheory', typedResult);
  return typedResult;
}

/**
 * Executes the Evaluate verb - projects onto Truth axis
 * @param {Object} subject - Subject typed value (VECTOR)
 * @param {Object} object - Object typed value (typically Truth vector)
 * @param {Object} context - Execution context
 * @returns {Object} Result typed value (SCALAR: truth score)
 */
function executeEvaluate(subject, object, context) {
  debug.enter('executor', 'executeEvaluate', { subject, object });

  validateType(subject, ['VECTOR'], 'Evaluate', 'subject');

  // Get Truth vector
  let truthVector;
  if (object.type === 'VECTOR') {
    truthVector = object.value;
  } else {
    // Try to get Truth from session
    const truth = getSymbol(context.session, 'Truth');
    if (truth && truth.type === 'VECTOR') {
      truthVector = truth.value;
    } else {
      throw new ExecutionError('Evaluate requires Truth vector as object or in session', null);
    }
  }

  // Compute cosine similarity and map to [0, 1]
  const similarity = vectorSpace.cosineSimilarity(subject.value, truthVector);
  const truthScore = (similarity + 1) / 2;

  debug.step('executor', `Evaluate: similarity=${similarity.toFixed(6)}, truthScore=${truthScore.toFixed(6)}`);

  const result = createTypedValue('SCALAR', truthScore);
  debug.exit('executor', 'executeEvaluate', result);
  return result;
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
  debug.enter('executor', 'executeVerbMacro', { name: verbMacro.name });

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

  debug.exit('executor', 'executeVerbMacro', result);
  return result;
}

/**
 * Executes a single statement
 * @param {Object} stmt - Statement AST
 * @param {Object} context - Execution context
 * @returns {Object} Result typed value
 */
function executeStatement(stmt, context) {
  debug.enter('executor', 'executeStatement', {
    declaration: stmt.declaration,
    verb: stmt.verb
  });

  // Resolve subject
  let subject;
  subject = resolveSymbol(stmt.subject, context);

  // Resolve object
  let object;
  object = resolveSymbol(stmt.object, context);

  // Resolve and execute verb
  const verb = resolveVerb(stmt.verb, context);
  let result;

  switch (verb.type) {
    case 'kernel':
      result = executeKernel(verb.name, subject, object, context);
      break;

    case 'numeric':
      result = executeNumeric(verb.name, subject, object, context);
      break;

    case 'planning':
      result = executePlanning(verb.name, subject, object, context);
      break;

    case 'theory':
      result = executeTheory(verb.name, subject, object, context);
      break;

    case 'persist':
      result = executePersist(subject, object, context);
      break;

    case 'describe':
      result = executeDescribe(subject, object, context);
      break;

    case 'evaluate':
      result = executeEvaluate(subject, object, context);
      break;

    case 'macro':
      result = executeVerbMacro(verb.macro, subject, object, context);
      break;

    default:
      throw new ExecutionError(`Unknown verb type: ${verb.type}`, stmt);
  }

  // Store result
  setSymbol(context.session, stmt.declaration, result);

  // Notify if callback set
  if (context.onSymbolDefined) {
    context.onSymbolDefined(stmt.declaration, result);
  }

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

  debug.exit('executor', 'executeStatement', result);
  return result;
}

/**
 * Executes a macro (theory, verb, or session)
 * @param {Object} macro - Macro AST
 * @param {Object} context - Execution context
 * @returns {Object} Execution result
 */
function executeMacro(macro, context) {
  debug.enter('executor', 'executeMacro', { name: macro.name, type: macro.declarationType });

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

  debug.exit('executor', 'executeMacro', { success: true });
  return { success: true };
}

/**
 * Executes a complete script
 * @param {Object} ast - Script AST
 * @param {Object} context - Execution context
 * @returns {Object} Execution result with symbols and trace
 */
function executeScript(ast, context) {
  debug.enter('executor', 'executeScript', { macroCount: ast.macros?.length, stmtCount: ast.statements?.length });

  const hasTraceId = Boolean(context.traceId);
  const existingTrace = hasTraceId ? getTrace(context.traceId) : null;
  const startedHere = hasTraceId && !existingTrace;
  if (startedHere) {
    startTrace(context.traceId);
  }

  try {
    // Process macros first
    for (const macro of ast.macros || []) {
      executeMacro(macro, context);
    }

    // Execute top-level statements respecting dependencies
    const scriptOrder = getExecutionOrder({ body: ast.statements || [] });
    for (const stmt of scriptOrder) {
      executeStatement(stmt, context);
    }

    // End trace only if we started it here; otherwise caller owns lifecycle
    const trace = startedHere ? endTrace(context.traceId) : (hasTraceId ? getTrace(context.traceId) : null);

    debug.exit('executor', 'executeScript', { success: true });
    return {
      success: true,
      symbols: context.session.localSymbols,
      trace
    };
  } catch (error) {
    if (startedHere) {
      endTrace(context.traceId);
    }
    debug.warn('executor', `Execution failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  executeScript,
  executeMacro,
  executeStatement,
  executeVerbMacro,
  executeEvaluate,
  createContext,
  resolveSymbol,
  resolveVerb,
  validateType,
  ExecutionError,
  TypeError,
  UnknownVerbError
};
