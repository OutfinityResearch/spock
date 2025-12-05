/**
 * @fileoverview Evaluation suite runner for Spock GOS
 * @implements DS evalSuite
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createSpockEngine } = require('../api/engineFactory');
const { createSessionApi } = require('../api/sessionApi');
const { resetConfig } = require('../config/config');

/**
 * Task types mapped to API methods
 */
const TASK_TYPE_MAP = {
  'Learn': 'learn',
  'Ask': 'ask',
  'Proof': 'prove',
  'Explain': 'explain',
  'Plan': 'plan',
  'Solve': 'solve',
  'Summarise': 'summarise'
};

/**
 * Loads a suite from disk
 * @param {string} suitePath - Path to suite directory
 * @returns {Object} Suite definition
 */
function loadSuite(suitePath) {
  const theoryPath = path.join(suitePath, 'theory.spockdsl');
  const tasksPath = path.join(suitePath, 'tasks.json');

  if (!fs.existsSync(theoryPath)) {
    throw new Error(`Suite missing theory.spockdsl: ${suitePath}`);
  }
  if (!fs.existsSync(tasksPath)) {
    throw new Error(`Suite missing tasks.json: ${suitePath}`);
  }

  const theory = fs.readFileSync(theoryPath, 'utf8');
  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

  if (!Array.isArray(tasks)) {
    throw new Error(`tasks.json must be an array: ${suitePath}`);
  }

  return {
    name: path.basename(suitePath),
    path: suitePath,
    theory,
    tasks
  };
}

/**
 * Discovers all suites in evalSuite directory
 * @param {string} evalSuiteDir - Path to evalSuite directory
 * @returns {Array<string>} Suite paths
 */
function discoverSuites(evalSuiteDir) {
  if (!fs.existsSync(evalSuiteDir)) {
    return [];
  }

  const entries = fs.readdirSync(evalSuiteDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => path.join(evalSuiteDir, e.name))
    .filter(p => fs.existsSync(path.join(p, 'tasks.json')));
}

/**
 * Compares actual output with expected output
 * @param {Object} actual - Actual result
 * @param {string} expected - Expected DSL output
 * @returns {Object} Comparison result
 */
function compareOutputs(actual, expected) {
  // Basic comparison: check if execution succeeded
  if (!actual.success) {
    return {
      match: false,
      reason: `Execution failed: ${actual.error}`
    };
  }

  // If expected output is empty, just check success
  if (!expected || expected.trim() === '') {
    return { match: true };
  }

  // Compare DSL outputs (normalized)
  const normalizeOutput = (s) => s
    .replace(/\s+/g, ' ')
    .replace(/#.*$/gm, '')  // Remove comments
    .trim()
    .toLowerCase();

  const actualNorm = normalizeOutput(actual.dslOutput || '');
  const expectedNorm = normalizeOutput(expected);

  // Check if actual contains key elements of expected
  // (fuzzy match since exact output may vary)
  const expectedTokens = expectedNorm.split(/\s+/).filter(t => t.startsWith('@'));
  const actualTokens = actualNorm.split(/\s+/).filter(t => t.startsWith('@'));

  const matchedTokens = expectedTokens.filter(t => actualTokens.includes(t));
  const matchRatio = expectedTokens.length > 0
    ? matchedTokens.length / expectedTokens.length
    : 1;

  return {
    match: matchRatio >= 0.8,  // 80% token match threshold
    matchRatio,
    reason: matchRatio < 0.8 ? 'Output mismatch' : undefined
  };
}

/**
 * Runs a single task
 * @param {Object} task - Task definition
 * @param {Object} api - Session API
 * @returns {Object} Task result
 */
function runTask(task, api) {
  const startTime = Date.now();

  const method = TASK_TYPE_MAP[task.TASK_TYPE] || 'ask';
  const dslTask = task.DSL_TASK;
  const expectedOutput = task.DSL_OUTPUT;

  let result;
  let error = null;

  try {
    result = api[method](dslTask);
  } catch (e) {
    error = e.message;
    result = { success: false, error: e.message };
  }

  const elapsed = Date.now() - startTime;
  const comparison = compareOutputs(result, expectedOutput);

  return {
    task: task.NL_TASK,
    type: task.TASK_TYPE,
    passed: comparison.match,
    reason: comparison.reason,
    matchRatio: comparison.matchRatio,
    truthScore: result.scores?.truth,
    confidence: result.scores?.confidence,
    elapsed,
    error
  };
}

/**
 * Runs a complete suite
 * @param {Object} suite - Suite definition
 * @param {Object} [options={}] - Run options
 * @returns {Object} Suite results
 */
function runSuite(suite, options = {}) {
  const { verbose = false, randomSeed = 42 } = options;

  if (verbose) {
    console.log(`\nRunning suite: ${suite.name}`);
    console.log('='.repeat(50));
  }

  // Reset and create fresh engine
  resetConfig();
  const engine = createSpockEngine({
    workingFolder: `.spock-eval-${suite.name}`,
    randomSeed
  });

  const session = engine.createSession();
  const api = createSessionApi(session);

  // Load theory
  let theoryLoaded = false;
  try {
    const theoryResult = api.learn(suite.theory);
    theoryLoaded = theoryResult.success;
    if (!theoryLoaded && verbose) {
      console.log(`  Warning: Theory load failed: ${theoryResult.error}`);
    }
  } catch (e) {
    if (verbose) {
      console.log(`  Warning: Theory load error: ${e.message}`);
    }
  }

  // Run tasks
  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < suite.tasks.length; i++) {
    const task = suite.tasks[i];
    const result = runTask(task, api);
    results.push(result);

    if (result.passed) {
      passed++;
      if (verbose) {
        console.log(`  ✓ Task ${i + 1}: ${task.NL_TASK.slice(0, 50)}...`);
      }
    } else {
      failed++;
      if (verbose) {
        console.log(`  ✗ Task ${i + 1}: ${task.NL_TASK.slice(0, 50)}...`);
        console.log(`    Reason: ${result.reason || result.error}`);
      }
    }
  }

  // Cleanup
  engine.shutdown();

  // Clean up eval working folder
  try {
    const evalFolder = `.spock-eval-${suite.name}`;
    if (fs.existsSync(evalFolder)) {
      fs.rmSync(evalFolder, { recursive: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }

  return {
    suite: suite.name,
    theoryLoaded,
    total: suite.tasks.length,
    passed,
    failed,
    passRate: suite.tasks.length > 0 ? passed / suite.tasks.length : 0,
    results
  };
}

/**
 * Runs all suites and produces summary
 * @param {string} evalSuiteDir - Path to evalSuite directory
 * @param {Object} [options={}] - Run options
 * @returns {Object} Overall results
 */
function runAllSuites(evalSuiteDir, options = {}) {
  const { verbose = false, filter = null } = options;

  console.log('\nSpock GOS Evaluation Suite');
  console.log('==========================\n');

  const suitePaths = discoverSuites(evalSuiteDir);

  if (suitePaths.length === 0) {
    console.log('No suites found in:', evalSuiteDir);
    return { suites: [], totalPassed: 0, totalFailed: 0, passRate: 0 };
  }

  console.log(`Found ${suitePaths.length} suite(s)\n`);

  const suiteResults = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suitePath of suitePaths) {
    const suiteName = path.basename(suitePath);

    // Apply filter if provided
    if (filter && !suiteName.includes(filter)) {
      continue;
    }

    try {
      const suite = loadSuite(suitePath);
      const result = runSuite(suite, options);
      suiteResults.push(result);

      totalPassed += result.passed;
      totalFailed += result.failed;

      if (!verbose) {
        const status = result.failed === 0 ? '✓' : '✗';
        console.log(`${status} ${suiteName}: ${result.passed}/${result.total} passed`);
      }
    } catch (e) {
      console.log(`✗ ${suiteName}: Error loading suite - ${e.message}`);
      suiteResults.push({
        suite: suiteName,
        error: e.message,
        passed: 0,
        failed: 0,
        total: 0
      });
    }
  }

  // Summary
  const totalTasks = totalPassed + totalFailed;
  const passRate = totalTasks > 0 ? totalPassed / totalTasks : 0;

  console.log('\n' + '='.repeat(50));
  console.log('Summary');
  console.log('='.repeat(50));
  console.log(`Suites: ${suiteResults.length}`);
  console.log(`Tasks:  ${totalPassed}/${totalTasks} passed (${(passRate * 100).toFixed(1)}%)`);

  return {
    suites: suiteResults,
    totalPassed,
    totalFailed,
    totalTasks,
    passRate
  };
}

/**
 * Generates a report from results
 * @param {Object} results - Results from runAllSuites
 * @param {string} [format='text'] - Output format (text, json, markdown)
 * @returns {string} Formatted report
 */
function generateReport(results, format = 'text') {
  if (format === 'json') {
    return JSON.stringify(results, null, 2);
  }

  if (format === 'markdown') {
    let md = '# Spock GOS Evaluation Report\n\n';
    md += `| Suite | Passed | Failed | Rate |\n`;
    md += `|-------|--------|--------|------|\n`;

    for (const suite of results.suites) {
      const rate = suite.total > 0 ? (suite.passed / suite.total * 100).toFixed(1) : 'N/A';
      md += `| ${suite.suite} | ${suite.passed} | ${suite.failed} | ${rate}% |\n`;
    }

    md += `\n**Total:** ${results.totalPassed}/${results.totalTasks} (${(results.passRate * 100).toFixed(1)}%)\n`;
    return md;
  }

  // Default text format
  let text = 'Spock GOS Evaluation Report\n';
  text += '===========================\n\n';

  for (const suite of results.suites) {
    text += `${suite.suite}:\n`;
    if (suite.error) {
      text += `  Error: ${suite.error}\n`;
    } else {
      text += `  Passed: ${suite.passed}/${suite.total}\n`;
      if (suite.results) {
        for (const r of suite.results) {
          const status = r.passed ? '✓' : '✗';
          text += `  ${status} ${r.task}\n`;
          if (!r.passed && r.reason) {
            text += `      ${r.reason}\n`;
          }
        }
      }
    }
    text += '\n';
  }

  text += `Total: ${results.totalPassed}/${results.totalTasks} (${(results.passRate * 100).toFixed(1)}%)\n`;
  return text;
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('-v') || args.includes('--verbose');
  const filter = args.find(a => !a.startsWith('-'));

  const evalSuiteDir = path.resolve(__dirname, '../../evalSuite');

  const results = runAllSuites(evalSuiteDir, { verbose, filter });

  if (args.includes('--json')) {
    console.log('\n' + generateReport(results, 'json'));
  } else if (args.includes('--markdown')) {
    console.log('\n' + generateReport(results, 'markdown'));
  }

  process.exit(results.totalFailed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  loadSuite,
  discoverSuites,
  runTask,
  runSuite,
  runAllSuites,
  generateReport,
  compareOutputs,
  TASK_TYPE_MAP
};
