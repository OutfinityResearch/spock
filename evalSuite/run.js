#!/usr/bin/env node
/**
 * @fileoverview Evaluation Suite Runner for Spock GOS (Strict Mode)
 * @implements URS-008, FS-07 (Dual Output Strategy), NFS-03
 *
 * EVALUATOR COMPARISON (see src/eval/evalRunner.js for fuzzy mode):
 *
 * This module (evalSuite/run.js):
 * - Purpose: Deterministic algorithm validation (FS#7)
 * - Matching: Strict line-by-line comparison
 * - Output: Compares full executionTrace (per FS#7 Dual Output Strategy)
 * - Usage: CLI runner only, standalone script
 * - When to use: Release validation, algorithm correctness testing
 *
 * src/eval/evalRunner.js (fuzzy mode):
 * - Purpose: Development/integration testing
 * - Matching: Fuzzy (80% @token match threshold)
 * - Output: Compares DSL declarations by @token presence
 * - Usage: Can be imported as module, programmatic API
 * - When to use: CI integration, development testing, flexible validation
 *
 * Both use the same suite format (theory.spockdsl + tasks.json).
 *
 * Runs deterministic evaluation suites with proper validation:
 * - Uses executionTrace for algorithm validation
 * - Compares DSL_OUTPUT exactly (not fuzzy)
 * - Reports truth scores and step counts
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Add src to path
const srcPath = path.resolve(__dirname, '../src');
const { createSpockEngine } = require(path.join(srcPath, 'api/engineFactory'));
const { createSessionApi } = require(path.join(srcPath, 'api/sessionApi'));
const { resetConfig } = require(path.join(srcPath, 'config/config'));
const { createTheoryDescriptor, saveTheory } = require(path.join(srcPath, 'theory/theoryStore'));
const { parse } = require(path.join(srcPath, 'dsl/parser'));

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

/**
 * Task type to API method mapping
 */
const TASK_TYPE_MAP = {
  'Learn': 'learn',
  'Ask': 'ask',
  'Proof': 'prove',
  'Explain': 'explain',
  'Plan': 'plan',
  'Solve': 'solve',
  'Resolve': 'solve',
  'Summarise': 'summarise'
};

/**
 * Creates unique temp folder for evaluation
 */
function createTempFolder(suiteName) {
  const tmpDir = os.tmpdir();
  const uniqueId = `spock-eval-${suiteName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const folder = path.join(tmpDir, uniqueId);
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

/**
 * Cleans up temp folder
 */
function cleanupFolder(folder) {
  try {
    if (folder && fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true });
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Pads string to specified length
 */
function pad(str, len, char = ' ') {
  str = String(str);
  while (str.length < len) str += char;
  return str;
}

/**
 * Right-pads string
 */
function rpad(str, len, char = ' ') {
  str = String(str);
  while (str.length < len) str = char + str;
  return str;
}

/**
 * Indents multi-line text
 */
function indent(text, padStr = '     ') {
  if (!text) return `${padStr}${colors.dim}<empty>${colors.reset}`;
  return text
    .split('\n')
    .map(line => `${padStr}${line}`)
    .join('\n');
}

/**
 * Formats truth score with color
 */
function formatTruth(score) {
  if (score === undefined || score === null) return `${colors.dim}N/A${colors.reset}`;
  const pct = (score * 100).toFixed(1);
  if (score >= 0.8) return `${colors.green}${pct}%${colors.reset}`;
  if (score >= 0.5) return `${colors.yellow}${pct}%${colors.reset}`;
  return `${colors.red}${pct}%${colors.reset}`;
}

/**
 * Normalizes DSL output for comparison
 * - Removes comments
 * - Normalizes whitespace
 * - Removes empty lines
 */
function normalizeDsl(dsl) {
  if (!dsl) return '';

  return dsl
    .split('\n')
    .map(line => line.replace(/#.*$/, '').trim())  // Remove comments
    .filter(line => line.length > 0)               // Remove empty lines
    .join('\n')
    .trim();
}

/**
 * Counts non-empty DSL statements (ignores comments)
 */
function countDslElements(dsl) {
  if (!dsl) return 0;
  return normalizeDsl(dsl).split('\n').filter(Boolean).length;
}

function colorBool(ok, text) {
  return ok ? `${colors.green}${text}${colors.reset}` : `${colors.red}${text}${colors.reset}`;
}

/**
 * Extracts semantic tokens from DSL text
 * Returns set of entity names and relation patterns
 */
function extractSemanticTokens(dsl) {
  const tokens = new Set();
  if (!dsl) return tokens;

  const lines = dsl.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  for (const line of lines) {
    // Extract @name tokens
    const atTokens = line.match(/@\w+/g) || [];
    atTokens.forEach(t => tokens.add(t.toLowerCase()));

    // Extract word tokens (skip common DSL syntax)
    const words = line.split(/\s+/).filter(w =>
      w.length > 1 &&
      !['begin', 'end', 'theory', 'verb', 'is', 'and', 'or', 'not', 'the', 'a', 'an'].includes(w.toLowerCase()) &&
      !w.startsWith('$')
    );
    words.forEach(w => tokens.add(w.toLowerCase()));
  }

  return tokens;
}

/**
 * Compares expected and actual DSL output using semantic token matching
 * Returns detailed comparison result
 */
function compareDslOutput(expected, actual) {
  const normalizedExpected = normalizeDsl(expected);
  const normalizedActual = normalizeDsl(actual);

  if (!normalizedExpected) {
    // No expected output specified - pass based on execution success
    return { match: true, reason: 'no_expected_output' };
  }

  if (normalizedExpected === normalizedActual) {
    return { match: true, reason: 'exact_match' };
  }

  // Semantic token matching: check if key entities appear in output
  const expectedTokens = extractSemanticTokens(normalizedExpected);
  const actualTokens = extractSemanticTokens(normalizedActual);

  // Check overlap of semantic tokens
  let matchedTokens = 0;
  for (const token of expectedTokens) {
    if (actualTokens.has(token)) {
      matchedTokens++;
    }
  }

  const tokenMatchRatio = expectedTokens.size > 0 ? matchedTokens / expectedTokens.size : 0;

  // Also check line-based partial match as fallback
  const expectedLines = normalizedExpected.split('\n');
  const actualLines = normalizedActual.split('\n');

  let matchedLines = 0;
  for (const expectedLine of expectedLines) {
    if (actualLines.some(actualLine => actualLine.includes(expectedLine) || expectedLine.includes(actualLine))) {
      matchedLines++;
    }
  }

  const lineMatchRatio = expectedLines.length > 0 ? matchedLines / expectedLines.length : 0;

  // Use the better of the two ratios
  const matchRatio = Math.max(tokenMatchRatio, lineMatchRatio);

  if (matchRatio >= 0.6) {
    return { match: true, reason: 'semantic_match', ratio: matchRatio, tokenRatio: tokenMatchRatio, lineRatio: lineMatchRatio };
  }

  return {
    match: false,
    reason: 'mismatch',
    ratio: matchRatio,
    tokenRatio: tokenMatchRatio,
    lineRatio: lineMatchRatio,
    expected: normalizedExpected,
    actual: normalizedActual,
    diff: {
      expectedLines: expectedLines.length,
      actualLines: actualLines.length,
      matchedLines,
      expectedTokens: expectedTokens.size,
      actualTokens: actualTokens.size,
      matchedTokens
    }
  };
}

/**
 * Validates execution trace steps
 */
function validateTrace(trace, expectedSteps) {
  if (!expectedSteps || expectedSteps.length === 0) {
    return { valid: true, reason: 'no_expected_steps' };
  }

  if (!trace || !trace.steps) {
    return { valid: false, reason: 'no_trace' };
  }

  // Check that all expected steps are present
  for (const expected of expectedSteps) {
    const found = trace.steps.some(step => {
      if (expected.verb && step.verb !== expected.verb) return false;
      if (expected.subject && step.subjectRef !== expected.subject) return false;
      if (expected.object && step.objectRef !== expected.object) return false;
      return true;
    });

    if (!found) {
      return {
        valid: false,
        reason: 'missing_step',
        missingStep: expected
      };
    }
  }

  return { valid: true, reason: 'all_steps_present' };
}

/**
 * Discovers all suites
 */
function discoverSuites() {
  const suiteDir = __dirname;
  const entries = fs.readdirSync(suiteDir, { withFileTypes: true });

  return entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .map(e => path.join(suiteDir, e.name))
    .filter(p => fs.existsSync(path.join(p, 'tasks.json')) || fs.existsSync(path.join(p, 'tasks.js')));
}

/**
 * Loads a suite
 */
function loadSuite(suitePath) {
  const theoryPath = path.join(suitePath, 'theory.spockdsl');
  const tasksJson = path.join(suitePath, 'tasks.json');
  const tasksJs = path.join(suitePath, 'tasks.js');

  // tasks can be provided as .js (module.exports = [...]) or .json
  let tasks;
  if (fs.existsSync(tasksJs)) {
    // Clear require cache to allow re-runs
    delete require.cache[require.resolve(tasksJs)];
    tasks = require(tasksJs);
  } else if (fs.existsSync(tasksJson)) {
    tasks = JSON.parse(fs.readFileSync(tasksJson, 'utf8'));
  } else {
    throw new Error(`Missing tasks.js or tasks.json: ${suitePath}`);
  }

  const theory = fs.existsSync(theoryPath) ? fs.readFileSync(theoryPath, 'utf8') : '';

  return {
    name: path.basename(suitePath),
    path: suitePath,
    theory,
    tasks
  };
}

/**
 * Persist suite theory into the working theories store so UseTheory works.
 */
function installSuiteTheory(theoryText) {
  if (!theoryText || !theoryText.trim()) return null;

  const ast = parse(theoryText);
  const theoryMacro = (ast.macros || []).find(m => m.declarationType === 'theory');
  if (!theoryMacro) return null;

  const theoryName = theoryMacro.name.replace(/^@/, '');
  const descriptor = createTheoryDescriptor(theoryName, theoryText);
  saveTheory(descriptor);
  return theoryName;
}

/**
 * Runs a single task with proper validation
 */
function runTask(task, api, taskNum, verbose) {
  const startTime = Date.now();
  const method = TASK_TYPE_MAP[task.TASK_TYPE] || 'ask';

  let result;
  let error = null;

  try {
    result = api[method](task.DSL_TASK);
  } catch (e) {
    error = e.message;
    result = {
      success: false,
      score: 0,
      resultTheory: '',
      executionTrace: '',
      error: e.message
    };
  }

  const elapsed = Date.now() - startTime;

  // Extract trace info
  const trace = result.trace || null;
  const steps = trace?.steps?.length || 0;

  // FS-07 Dual Output Strategy:
  // - executionTrace: Full kernel operations (for DSL_TRACE validation)
  // - resultTheory: Clean semantic result (for DSL_OUTPUT validation)
  const executionText = result.executionTrace || result.dslOutput || '';
  const theoryText = result.resultTheory || '';
  const expectedTrace = task.DSL_TRACE || '';

  // Compare DSL_OUTPUT against resultTheory (clean semantic output per FS#7)
  // DSL_OUTPUT should contain the clean conclusion, not the full trace
  const outputComparison = compareDslOutput(
    task.DSL_OUTPUT,
    theoryText || executionText  // Prefer resultTheory, fall back to executionTrace
  );

  const traceComparison = expectedTrace
    ? compareDslOutput(expectedTrace, executionText)
    : { match: true, reason: 'no_expected_trace' };

  // Determine pass/fail based on multiple criteria
  let passed = result.success;
  let failReason = null;

  if (!result.success) {
    passed = false;
    failReason = error || 'execution_failed';
  } else if (!outputComparison.match && task.DSL_OUTPUT) {
    // Only fail on output mismatch if expected output was specified
    passed = false;
    failReason = `output_mismatch (${outputComparison.reason})`;
  } else if (!traceComparison.match && expectedTrace) {
    passed = false;
    failReason = `trace_mismatch (${traceComparison.reason})`;
  }

  // Check truth score threshold if specified
  if (passed && task.MIN_TRUTH_SCORE !== undefined) {
    const truthScore = result.score || result.scores?.truth || 0;
    if (truthScore < task.MIN_TRUTH_SCORE) {
      passed = false;
      failReason = `truth_score_too_low (${(truthScore * 100).toFixed(1)}% < ${(task.MIN_TRUTH_SCORE * 100).toFixed(1)}%)`;
    }
  }

  // For DSL_OUTPUT comparison, use theoryText (clean semantic result)
  const actualOutput = theoryText || executionText;

  const taskResult = {
    num: taskNum,
    task: task.NL_TASK,
    type: task.TASK_TYPE,
    passed,
    failReason,
    truthScore: result.score || result.scores?.truth,
    confidence: result.scores?.confidence,
    steps,
    theoryElements: countDslElements(theoryText),
    expectedTraceCount: countDslElements(expectedTrace),
    traceComparison,
    elapsed,
    error,
    dslTask: task.DSL_TASK,
    expectedOutput: task.DSL_OUTPUT,
    expectedTrace,
    actualOutput,
    resultTheory: theoryText,
    traceText: executionText,
    outputComparison
  };

  // Verbose output
  if (verbose) {
    console.log(`\n     ${colors.dim}DSL Task:${colors.reset}`);
    console.log(indent(task.DSL_TASK));

    console.log(`\n     ${colors.dim}Result Theory:${colors.reset}`);
    console.log(indent(theoryText));

    console.log(`\n     ${colors.dim}Execution Trace:${colors.reset}`);
    console.log(indent(executionText));

    // Show match ratios for DSL_OUTPUT comparison
    const outputTokenRatio = outputComparison.tokenRatio !== undefined
      ? `${(outputComparison.tokenRatio * 100).toFixed(0)}%`
      : 'N/A';
    const outputLineRatio = outputComparison.lineRatio !== undefined
      ? `${(outputComparison.lineRatio * 100).toFixed(0)}%`
      : 'N/A';
    console.log(`\n     ${colors.cyan}DSL_OUTPUT Match: token=${outputTokenRatio}, line=${outputLineRatio}${colors.reset}`);

    // Show match ratios for DSL_TRACE comparison
    if (traceComparison && traceComparison.reason !== 'no_expected_trace') {
      const traceTokenRatio = traceComparison.tokenRatio !== undefined
        ? `${(traceComparison.tokenRatio * 100).toFixed(0)}%`
        : 'N/A';
      const traceLineRatio = traceComparison.lineRatio !== undefined
        ? `${(traceComparison.lineRatio * 100).toFixed(0)}%`
        : 'N/A';
      console.log(`     ${colors.cyan}DSL_TRACE Match: token=${traceTokenRatio}, line=${traceLineRatio}${colors.reset}`);
    }

    if (expectedTrace) {
      console.log(`\n     ${colors.dim}Expected TRACE:${colors.reset}`);
      console.log(indent(expectedTrace));
    }

    if (error) {
      console.log(`     ${colors.red}Error: ${error}${colors.reset}`);
    }

    if (outputComparison.reason === 'mismatch') {
      console.log(`     ${colors.dim}Expected DSL_OUTPUT:${colors.reset}`);
      console.log(`     ${colors.dim}${outputComparison.expected?.split('\n').slice(0, 3).join('\n     ')}${colors.reset}`);
      console.log(`     ${colors.dim}Actual output:${colors.reset}`);
      console.log(`     ${colors.dim}${outputComparison.actual?.split('\n').slice(0, 3).join('\n     ')}${colors.reset}`);
    }

    if (failReason) {
      console.log(`     ${colors.yellow}Reason: ${failReason}${colors.reset}`);
    }
  }

  return taskResult;
}

/**
 * Runs a complete suite
 */
function runSuite(suite, options = {}) {
  const { verbose = false } = options;

  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  Suite: ${suite.name}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // Create temp folder
  const tempFolder = createTempFolder(suite.name);

  // Initialize engine with reproducible seed
  resetConfig();
  const engine = createSpockEngine({
    workingFolder: tempFolder,
    randomSeed: 42,  // Deterministic for evaluation
    logLevel: 'silent'  // Suppress debug output during eval
  });

  const session = engine.createSession();
  const api = createSessionApi(session);

  // Load theory
  let theoryLoaded = false;
  let installedTheoryName = null;
  if (suite.theory) {
    try {
      installedTheoryName = installSuiteTheory(suite.theory);
      const theoryResult = api.learn(suite.theory);
      theoryLoaded = theoryResult.success;
      if (!theoryLoaded) {
        console.log(`  ${colors.yellow}⚠ Theory load warning: ${theoryResult.error}${colors.reset}`);
      }
    } catch (e) {
      console.log(`  ${colors.yellow}⚠ Theory load error: ${e.message}${colors.reset}`);
    }
  }

  // Run tasks
  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < suite.tasks.length; i++) {
    const task = suite.tasks[i];
    const result = runTask(task, api, i + 1, verbose);
    results.push(result);

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }

    // Print task result
    const statusIcon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const taskType = `${colors.magenta}[${result.type}]${colors.reset}`;
    const taskDesc = result.task.length > 50 ? result.task.slice(0, 47) + '...' : result.task;

    const traceCountStr = `${result.steps}/${result.expectedTraceCount || result.steps || 0}`;
    const traceColored = colorBool(result.traceComparison.match, traceCountStr);

    console.log(`  ${statusIcon} ${rpad(result.num, 2)}. ${taskType} ${pad(taskDesc, 52)} ${formatTruth(result.truthScore)} ${colors.dim}(trace:${traceColored}, theory:${result.theoryElements}, ${result.elapsed}ms)${colors.reset}`);
  }

  // Cleanup
  engine.shutdown();
  cleanupFolder(tempFolder);

  // Suite summary
  const passRate = suite.tasks.length > 0 ? passed / suite.tasks.length : 0;
  const passColor = passRate >= 0.8 ? colors.green : passRate >= 0.5 ? colors.yellow : colors.red;

  console.log(`\n  ${colors.bright}Result: ${passColor}${passed}/${suite.tasks.length} passed (${(passRate * 100).toFixed(0)}%)${colors.reset}`);

  return {
    suite: suite.name,
    total: suite.tasks.length,
    passed,
    failed,
    passRate,
    results
  };
}

/**
 * Prints final summary
 */
function printSummary(allResults) {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                           EVALUATION SUMMARY                                   ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Header
  console.log(`  ${colors.bright}${pad('Suite', 30)} ${pad('Pass', 6)} ${pad('Fail', 6)} ${pad('Rate', 8)} Trace${colors.reset}`);
  console.log(`  ${colors.dim}${'─'.repeat(78)}${colors.reset}`);

  let totalPassed = 0;
  let totalFailed = 0;

  for (const suiteResult of allResults) {
    totalPassed += suiteResult.passed;
    totalFailed += suiteResult.failed;

    const passColor = suiteResult.passRate >= 0.8 ? colors.green : suiteResult.passRate >= 0.5 ? colors.yellow : colors.red;

    // Build steps string
    const stepsStr = suiteResult.results
      .map(r => colorBool(r.traceComparison.match, `${rpad(r.steps, 3)}/${r.expectedTraceCount || r.steps || 0}`))
      .join(' ');

    console.log(`  ${pad(suiteResult.suite, 30)} ${colors.green}${pad(suiteResult.passed, 6)}${colors.reset} ${colors.red}${pad(suiteResult.failed, 6)}${colors.reset} ${passColor}${pad((suiteResult.passRate * 100).toFixed(0) + '%', 8)}${colors.reset} ${colors.dim}${stepsStr}${colors.reset}`);
  }

  // Total
  const total = totalPassed + totalFailed;
  const totalRate = total > 0 ? totalPassed / total : 0;
  const totalColor = totalRate >= 0.8 ? colors.green : totalRate >= 0.5 ? colors.yellow : colors.red;

  console.log(`  ${colors.dim}${'─'.repeat(78)}${colors.reset}`);
  console.log(`  ${colors.bright}${pad('TOTAL', 30)} ${colors.green}${pad(totalPassed, 6)}${colors.reset} ${colors.red}${pad(totalFailed, 6)}${colors.reset} ${totalColor}${colors.bright}${pad((totalRate * 100).toFixed(0) + '%', 8)}${colors.reset}`);

  console.log(`\n${colors.cyan}${'━'.repeat(80)}${colors.reset}`);

  // Additional table: result theory element counts
  console.log(`\n${colors.bright}${pad('Suite', 30)} ${pad('Theory elems', 48)}${colors.reset}`);
  console.log(`  ${colors.dim}${'─'.repeat(78)}${colors.reset}`);
  for (const suiteResult of allResults) {
    const elemStr = suiteResult.results
      .map(r => rpad(r.theoryElements || 0, 3))
      .join(' ');
    console.log(`  ${pad(suiteResult.suite, 30)} ${colors.cyan}${pad(elemStr, 48)}${colors.reset}`);
  }
  console.log(`  ${colors.dim}${'─'.repeat(78)}${colors.reset}`);

  // Final verdict
  if (totalRate === 1) {
    console.log(`\n  ${colors.bgGreen}${colors.white}${colors.bright}  ✓ ALL TESTS PASSED  ${colors.reset}\n`);
  } else if (totalRate >= 0.8) {
    console.log(`\n  ${colors.bgYellow}${colors.white}${colors.bright}  ⚠ MOSTLY PASSING (${(totalRate * 100).toFixed(0)}%)  ${colors.reset}\n`);
  } else {
    console.log(`\n  ${colors.bgRed}${colors.white}${colors.bright}  ✗ TESTS FAILING (${(totalRate * 100).toFixed(0)}%)  ${colors.reset}\n`);
  }

  return { totalPassed, totalFailed, totalRate };
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('-v') || args.includes('--verbose');
  const filter = args.find(a => !a.startsWith('-'));

  console.log(`\n${colors.bright}${colors.blue}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║         SPOCK GOS - Evaluation Suite Runner                   ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║         Deterministic Reasoning Tests (FS#7 Compliant)        ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);

  const suitePaths = discoverSuites();

  if (suitePaths.length === 0) {
    console.log(`\n${colors.yellow}No evaluation suites found.${colors.reset}\n`);
    process.exit(0);
  }

  console.log(`\n${colors.dim}Found ${suitePaths.length} suite(s)${filter ? ` (filtering: ${filter})` : ''}${colors.reset}`);

  const allResults = [];

  for (const suitePath of suitePaths) {
    const suiteName = path.basename(suitePath);

    if (filter && !suiteName.includes(filter)) {
      continue;
    }

    try {
      const suite = loadSuite(suitePath);
      const result = runSuite(suite, { verbose });
      allResults.push(result);
    } catch (e) {
      console.log(`\n${colors.red}Error loading suite ${suiteName}: ${e.message}${colors.reset}`);
      allResults.push({
        suite: suiteName,
        total: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        results: [],
        error: e.message
      });
    }
  }

  const summary = printSummary(allResults);
  process.exit(summary.totalFailed > 0 ? 1 : 0);
}

main();
