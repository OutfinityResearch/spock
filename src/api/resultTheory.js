/**
 * @fileoverview Result Theory Builder
 * @implements FS-07 (Dual Output Strategy)
 *
 * Generates the "Result Theory" - a clean DSL macro containing only
 * the final conclusions, facts, or plans. This is the production output.
 *
 * Purpose:
 * - Production consumption: Clean, usable output
 * - Pipelining: Can be loaded into new sessions
 * - Reutilization: Cacheable, shareable conclusions
 *
 * Format: @Result theory macro with only final facts:
 *   @Result theory begin
 *       @fact Socrates Is Mortal
 *       @confidence fact HasTruth 0.95
 *   end
 */

'use strict';

/**
 * Builds result theory from execution context and trace
 * Per FS-07: Result Theory should reflect the actual executed facts
 *
 * @param {Object} context - Execution context
 * @param {Object} options - Build options
 * @param {Object} [options.trace] - Execution trace with steps
 * @param {string} [options.theoryName] - Name for the theory (default: 'Result')
 * @param {boolean} [options.includeConfidence] - Include confidence scores
 * @param {boolean} [options.includeMetadata] - Include metadata comments
 * @returns {string} DSL macro with clean result
 */
function buildResultTheory(context, options = {}) {
  const {
    theoryName = 'Result',
    includeConfidence = true,
    includeMetadata = false,
    trace = null
  } = options;

  const lines = [];

  // Header
  lines.push(`@${theoryName} theory begin`);

  // Extract conclusions from context AND trace (FS-07)
  const conclusions = extractConclusions(context, trace);

  for (const conclusion of conclusions) {
    lines.push(formatConclusion(conclusion, { includeConfidence }));
  }

  // Optional metadata
  if (includeMetadata) {
    lines.push('');
    lines.push('    # Metadata');
    if (context && context.metadata) {
      if (context.metadata.timestamp) {
        lines.push(`    # Generated: ${context.metadata.timestamp}`);
      }
      if (context.metadata.duration) {
        lines.push(`    # Duration: ${context.metadata.duration}ms`);
      }
    }
    if (trace && trace.duration) {
      lines.push(`    # Trace duration: ${trace.duration}ms`);
      lines.push(`    # Trace steps: ${trace.steps ? trace.steps.length : 0}`);
    }
  }

  lines.push('end');

  return lines.join('\n');
}

/**
 * Extracts conclusions from execution context and trace
 * Per FS-07: Result Theory should reflect the actual executed facts
 *
 * @param {Object} context - Execution context
 * @param {Object} [trace] - Optional trace object with steps
 * @returns {Array} List of conclusion objects
 */
function extractConclusions(context, trace = null) {
  const conclusions = [];

  if (!context) return conclusions;

  // FS-07: First, extract from trace steps (actual executed operations)
  if (trace && trace.steps && trace.steps.length > 0) {
    const executedFacts = extractFactsFromTrace(trace);
    conclusions.push(...executedFacts);
  }

  // Handle different result types
  if (context.result) {
    const result = context.result;

    // Single fact conclusion
    if (result.type === 'FACT' || result.type === 'CONCLUSION') {
      conclusions.push({
        type: 'fact',
        subject: result.subject,
        verb: result.verb || 'Is',
        object: result.object,
        truth: result.truth || result.score,
        confidence: result.confidence
      });
    }

    // Query answer
    if (result.type === 'ANSWER') {
      conclusions.push({
        type: 'answer',
        query: result.query,
        value: result.value,
        truth: result.truth,
        confidence: result.confidence
      });
    }

    // Plan steps
    if (result.type === 'PLAN' && Array.isArray(result.steps)) {
      for (let i = 0; i < result.steps.length; i++) {
        const step = result.steps[i];
        conclusions.push({
          type: 'planStep',
          index: i + 1,
          action: step.action,
          target: step.target,
          precondition: step.precondition,
          effect: step.effect
        });
      }
    }

    // Explanation
    if (result.type === 'EXPLANATION') {
      conclusions.push({
        type: 'explanation',
        because: result.because,
        therefore: result.therefore,
        confidence: result.confidence
      });
    }
  }

  // Handle symbols from session (if no trace facts found)
  if (conclusions.length === 0 && context.symbols) {
    for (const [name, value] of context.symbols) {
      // Skip internal symbols
      if (name.startsWith('_') || name.startsWith('@step')) continue;

      // Include @result
      if (name === '@result') {
        if (value.type === 'SCALAR') {
          conclusions.push({
            type: 'scalar',
            name: 'result',
            value: value.value
          });
        }
      }

      // Include declared facts
      if (value.type === 'FACT') {
        conclusions.push({
          type: 'fact',
          subject: value.subject || name,
          verb: value.verb || 'Is',
          object: value.object,
          truth: value.truth
        });
      }
    }
  }

  // Handle truth scores - attach to first conclusion
  if (context.scores) {
    if (context.scores.truth !== undefined && conclusions.length > 0) {
      conclusions[0].truth = context.scores.truth;
    }
    if (context.scores.confidence !== undefined && conclusions.length > 0) {
      conclusions[0].confidence = context.scores.confidence;
    }
  }

  return conclusions;
}

/**
 * Extracts fact-like conclusions from trace steps
 * This reflects the actual operations that were executed
 *
 * @param {Object} trace - Trace object with steps
 * @returns {Array} List of fact conclusions
 */
function extractFactsFromTrace(trace) {
  const facts = [];

  if (!trace || !trace.steps) return facts;

  // Semantic verbs that represent facts (not just kernel operations)
  const semanticVerbs = new Set([
    'IS_A', 'Is', 'Has', 'HasPart', 'PartOf', 'Implies', 'Causes',
    'Before', 'After', 'Contains', 'IsIn', 'Defines', 'Equals',
    'GreaterThan', 'LessThan', 'HasProperty', 'HasNumericValue'
  ]);

  // Also capture key kernel ops that represent relationships
  const relationVerbs = new Set(['Bind', 'Add', 'Blend']);

  for (const step of trace.steps) {
    // Check if this is a semantic fact
    if (semanticVerbs.has(step.verb)) {
      facts.push({
        type: 'fact',
        subject: step.subjectRef,
        verb: step.verb,
        object: step.objectRef || '_',
        source: 'trace',
        stepId: step.stepId
      });
    }

    // For relationship verbs, if the refs are named symbols (not @stepN)
    if (relationVerbs.has(step.verb)) {
      const isNamedSubject = step.subjectRef && !step.subjectRef.startsWith('@step');
      const isNamedObject = step.objectRef && !step.objectRef.startsWith('@step');

      if (isNamedSubject && isNamedObject) {
        facts.push({
          type: 'relation',
          subject: step.subjectRef,
          verb: step.verb,
          object: step.objectRef,
          source: 'trace',
          stepId: step.stepId
        });
      }
    }
  }

  return facts;
}

/**
 * Formats a single conclusion as DSL
 * @param {Object} conclusion - Conclusion object
 * @param {Object} options - Formatting options
 * @returns {string} DSL line
 */
function formatConclusion(conclusion, options = {}) {
  const { includeConfidence = true } = options;
  const indent = '    ';

  switch (conclusion.type) {
    case 'fact':
      let factLine = `${indent}@fact ${conclusion.subject} ${conclusion.verb} ${conclusion.object}`;
      if (includeConfidence && conclusion.truth !== undefined) {
        factLine += `\n${indent}@confidence fact HasTruth ${conclusion.truth.toFixed(4)}`;
      }
      return factLine;

    case 'answer':
      let answerLine = `${indent}@answer ${conclusion.query} HasValue ${conclusion.value}`;
      if (includeConfidence && conclusion.truth !== undefined) {
        answerLine += `\n${indent}@confidence answer HasTruth ${conclusion.truth.toFixed(4)}`;
      }
      return answerLine;

    case 'planStep':
      let stepLine = `${indent}@step${conclusion.index} ${conclusion.action}`;
      if (conclusion.target) {
        stepLine += ` Target ${conclusion.target}`;
      }
      return stepLine;

    case 'explanation':
      let explainLine = `${indent}@because ${conclusion.because}`;
      explainLine += `\n${indent}@therefore ${conclusion.therefore}`;
      if (includeConfidence && conclusion.confidence !== undefined) {
        explainLine += `\n${indent}@confidence explanation HasTruth ${conclusion.confidence.toFixed(4)}`;
      }
      return explainLine;

    case 'scalar':
      return `${indent}@${conclusion.name} HasValue ${conclusion.value.toFixed(4)}`;

    case 'relation':
      // Kernel-level relations (Bind, Add, Blend between named symbols)
      return `${indent}@rel ${conclusion.subject} ${conclusion.verb} ${conclusion.object}`;

    default:
      return `${indent}# Unknown conclusion type: ${conclusion.type}`;
  }
}

/**
 * Builds a simple result theory from truth score
 * @param {Object} params - Parameters
 * @param {string} params.subject - Subject name
 * @param {string} params.verb - Verb
 * @param {string} params.object - Object name
 * @param {number} params.truth - Truth score [0, 1]
 * @param {number} params.confidence - Confidence score [0, 1]
 * @returns {string} DSL result theory
 */
function buildSimpleResult(params) {
  const {
    subject = 'query',
    verb = 'HasTruth',
    object,
    truth = 0,
    confidence
  } = params;

  const lines = [
    '@Answer theory begin'
  ];

  if (object) {
    lines.push(`    @fact ${subject} ${verb} ${object}`);
  }

  lines.push(`    @truth result HasValue ${truth.toFixed(4)}`);

  if (confidence !== undefined) {
    lines.push(`    @confidence result HasValue ${confidence.toFixed(4)}`);
  }

  lines.push('end');

  return lines.join('\n');
}

/**
 * Builds an error result theory
 * @param {string} errorMessage - Error message
 * @returns {string} DSL error theory
 */
function buildErrorResult(errorMessage) {
  return [
    '@Error theory begin',
    `    @error message HasValue "${escapeString(errorMessage)}"`,
    '    @success result HasValue false',
    'end'
  ].join('\n');
}

/**
 * Builds a plan result theory
 * @param {Array} steps - Plan steps
 * @param {number} confidence - Overall plan confidence
 * @returns {string} DSL plan theory
 */
function buildPlanResult(steps, confidence = 1.0) {
  const lines = [
    '@Plan theory begin'
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    lines.push(`    @step${i + 1} action Is "${escapeString(step.action || step)}"`);
    if (step.target) {
      lines.push(`    @step${i + 1} target Is ${step.target}`);
    }
  }

  lines.push('');
  lines.push(`    @confidence plan HasValue ${confidence.toFixed(4)}`);
  lines.push(`    @stepCount plan HasValue ${steps.length}`);
  lines.push('end');

  return lines.join('\n');
}

/**
 * Escapes a string for DSL output
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
function escapeString(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/**
 * Parses a result theory back into structured data
 * @param {string} theoryScript - DSL theory script
 * @returns {Object} Parsed result
 */
function parseResultTheory(theoryScript) {
  const result = {
    type: null,
    facts: [],
    confidence: null,
    truth: null
  };

  if (!theoryScript) return result;

  const lines = theoryScript.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect theory type
    if (trimmed.startsWith('@Answer')) result.type = 'ANSWER';
    if (trimmed.startsWith('@Plan')) result.type = 'PLAN';
    if (trimmed.startsWith('@Error')) result.type = 'ERROR';
    if (trimmed.startsWith('@Result')) result.type = 'RESULT';

    // Parse facts
    if (trimmed.startsWith('@fact ')) {
      const parts = trimmed.substring(6).split(/\s+/);
      if (parts.length >= 3) {
        result.facts.push({
          subject: parts[0],
          verb: parts[1],
          object: parts.slice(2).join(' ')
        });
      }
    }

    // Parse confidence
    if (trimmed.includes('HasTruth')) {
      const match = trimmed.match(/HasTruth\s+([\d.]+)/);
      if (match) {
        if (trimmed.includes('@confidence')) {
          result.confidence = parseFloat(match[1]);
        } else if (trimmed.includes('@truth')) {
          result.truth = parseFloat(match[1]);
        }
      }
    }

    // Parse HasValue
    if (trimmed.includes('HasValue')) {
      const match = trimmed.match(/HasValue\s+([\d.]+|true|false|"[^"]*")/);
      if (match) {
        let value = match[1];
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value.startsWith('"')) value = value.slice(1, -1);
        else value = parseFloat(value);

        if (trimmed.includes('@truth')) result.truth = value;
        if (trimmed.includes('@confidence')) result.confidence = value;
      }
    }
  }

  return result;
}

module.exports = {
  buildResultTheory,
  buildSimpleResult,
  buildErrorResult,
  buildPlanResult,
  parseResultTheory,
  extractConclusions,
  extractFactsFromTrace,
  formatConclusion,
  escapeString
};
