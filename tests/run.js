#!/usr/bin/env node
/**
 * @fileoverview Main Test Runner for Spock GOS
 *
 * Usage:
 *   node tests/run.js                  # Run all tests
 *   node tests/run.js --suite kernel   # Run kernel suite
 *   node tests/run.js --suite dsl      # Run DSL suite
 *   node tests/run.js --verbose        # Verbose output
 *   node tests/run.js --help           # Show help
 *
 * Specs: DS_tests_map.md
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Colors
const colors = process.stdout.isTTY;
const c = {
  reset: colors ? '\x1b[0m' : '',
  bright: colors ? '\x1b[1m' : '',
  dim: colors ? '\x1b[2m' : '',
  green: colors ? '\x1b[32m' : '',
  red: colors ? '\x1b[31m' : '',
  yellow: colors ? '\x1b[33m' : '',
  blue: colors ? '\x1b[34m' : '',
  cyan: colors ? '\x1b[36m' : ''
};

// Test suite definitions
const suites = {
  kernel: {
    name: 'Kernel Layer',
    files: [
      'kernel/vectorSpace.test.js',
      'kernel/primitiveOps.test.js',
      'kernel/numericKernel.test.js'
    ],
    specs: ['URS-003', 'FS-01', 'FS-02', 'DS-Kernel']
  },
  dsl: {
    name: 'DSL Engine',
    files: [
      'dsl/tokenizer.test.js',
      'dsl/parser.test.js',
      'dsl/dependencyGraph.test.js',
      'dsl/executor.test.js'
    ],
    specs: ['URS-004', 'FS-03', 'DS-DSL']
  },
  session: {
    name: 'Session Management',
    files: [
      'session/sessionManager.test.js'
    ],
    specs: ['URS-005', 'FS-04', 'DS-Session']
  },
  theory: {
    name: 'Theory Storage & Versioning',
    files: [
      'theory/theoryStore.test.js',
      'theory/theoryVersioning.test.js'
    ],
    specs: ['URS-005', 'FS-04', 'FS-06', 'DS-Theory']
  },
  planning: {
    name: 'Planning & Solving',
    files: [
      'planning/planner.test.js'
    ],
    specs: ['URS-004', 'FS-02', 'DS-Planning']
  },
  logging: {
    name: 'Trace Logging',
    files: [
      'logging/traceLogger.test.js'
    ],
    specs: ['URS-008', 'FS-07', 'DS-DSL']
  },
  api: {
    name: 'Public API',
    files: [
      'api/engineFactory.test.js',
      'api/sessionApi.test.js'
    ],
    specs: ['URS-006', 'URS-007', 'FS-06']
  }
};

// CLI argument parsing
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h'),
  suite: null
};

// Find --suite argument
const suiteIdx = args.indexOf('--suite');
if (suiteIdx !== -1 && args[suiteIdx + 1]) {
  options.suite = args[suiteIdx + 1];
}

// Help text
if (options.help) {
  console.log(`
${c.bright}Spock GOS Test Runner${c.reset}

${c.cyan}Usage:${c.reset}
  node tests/run.js [options]

${c.cyan}Options:${c.reset}
  --suite <name>   Run specific test suite
  --verbose, -v    Show detailed test output
  --help, -h       Show this help

${c.cyan}Available Suites:${c.reset}
${Object.entries(suites).map(([key, s]) => `  ${c.bright}${key}${c.reset}\t${s.name} (${s.files.length} files)`).join('\n')}

${c.cyan}Examples:${c.reset}
  node tests/run.js                    # Run all tests
  node tests/run.js --suite kernel     # Run kernel tests only
  node tests/run.js --verbose          # Verbose output

${c.cyan}Test Files:${c.reset}
  Each test file can also be run individually:
  node tests/kernel/vectorSpace.test.js
  node tests/kernel/vectorSpace.test.js --verbose
`);
  process.exit(0);
}

// Run a single test file
function runTestFile(filePath) {
  return new Promise((resolve) => {
    const fullPath = path.join(__dirname, filePath);

    if (!fs.existsSync(fullPath)) {
      resolve({
        file: filePath,
        success: false,
        error: 'File not found',
        passed: 0,
        failed: 1,
        output: ''
      });
      return;
    }

    // Announce which test is running for easier tracing
    console.log(`\n${c.dim}→ Running ${filePath} (cwd: ${process.cwd()})${c.reset}`);

    // Capture stdout/stderr via temp files (the harness can mute pipes)
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spock-test-'));
    const stdoutPath = path.join(tmpDir, 'stdout.log');
    const stderrPath = path.join(tmpDir, 'stderr.log');
    const stdoutFd = fs.openSync(stdoutPath, 'w');
    const stderrFd = fs.openSync(stderrPath, 'w');

    const args = options.verbose ? ['--verbose'] : [];
    const proc = spawn('node', [fullPath, ...args], {
      stdio: ['inherit', stdoutFd, stderrFd],
      env: {
        ...process.env,
        VERBOSE: options.verbose ? 'true' : 'false'
      }
    });

    const cleanupAndResolve = (result) => {
      try {
        fs.closeSync(stdoutFd);
        fs.closeSync(stderrFd);

        // Read captured output
        const output = fs.existsSync(stdoutPath) ? fs.readFileSync(stdoutPath, 'utf8') : '';
        const errorOutput = fs.existsSync(stderrPath) ? fs.readFileSync(stderrPath, 'utf8') : '';

        // Echo outputs by default so user sees what happened
        if (output.trim().length > 0) {
          console.log(output.trim());
        }
        if (errorOutput.trim().length > 0) {
          console.error(errorOutput.trim());
        }

        // Parse results from output
        // Preferred format from testFramework (colors stripped by regex)
        const passMatch = output.match(/Passed:\s*(\d+)/i);
        const failMatch = output.match(/Failed:\s*(\d+)/i);

        // Fallback for legacy test files: "<file>: N tests, X passed, Y failed"
        const legacyMatch = output.match(/(\d+)\s+tests,\s*(\d+)\s+passed,\s*(\d+)\s+failed/i);

        const passed = passMatch
          ? parseInt(passMatch[1], 10)
          : legacyMatch
            ? parseInt(legacyMatch[2], 10)
            : 0;

        const failed = failMatch
          ? parseInt(failMatch[1], 10)
          : legacyMatch
            ? parseInt(legacyMatch[3], 10)
            : 0;

        resolve({
          file: filePath,
          passed,
          failed,
          output,
          errorOutput,
          ...result
        });
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    };

    proc.on('close', (code) => {
      cleanupAndResolve({ success: code === 0 });
    });

    proc.on('error', (err) => {
      cleanupAndResolve({
        success: false,
        error: err.message
      });
    });
  });
}

// Run a suite
async function runSuite(suiteName, suite) {
  console.log('');
  console.log(`${c.bright}${c.blue}▶ ${suite.name}${c.reset}`);
  console.log(`${c.dim}  Files: ${suite.files.join(', ')}${c.reset}`);
  console.log(`${c.dim}  Specs: ${suite.specs.join(', ')}${c.reset}`);
  console.log('');

  const results = [];

  for (const file of suite.files) {
    const result = await runTestFile(file);
    results.push(result);

    // Show file result
    if (result.success) {
      console.log(`  ${c.green}✓${c.reset} ${file} ${c.dim}(${result.passed} passed)${c.reset}`);
    } else {
      console.log(`  ${c.red}✗${c.reset} ${file} ${c.dim}(${result.passed} passed, ${result.failed} failed)${c.reset}`);
      if (options.verbose && result.output) {
        console.log(result.output);
      }
    }
  }

  return results;
}

// Main
async function main() {
  console.log('');
  console.log(`${c.bright}╔══════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bright}║              SPOCK GOS - TEST SUITE                       ║${c.reset}`);
  console.log(`${c.bright}╚══════════════════════════════════════════════════════════╝${c.reset}`);

  const startTime = Date.now();
  let allResults = [];

  // Determine which suites to run
  let suitesToRun = Object.entries(suites);
  if (options.suite) {
    if (!suites[options.suite]) {
      console.error(`${c.red}Unknown suite: ${options.suite}${c.reset}`);
      console.log(`Available suites: ${Object.keys(suites).join(', ')}`);
      process.exit(1);
    }
    suitesToRun = [[options.suite, suites[options.suite]]];
  }

  // Run suites
  for (const [name, suite] of suitesToRun) {
    const results = await runSuite(name, suite);
    allResults = allResults.concat(results);
  }

  // Calculate totals
  const totalPassed = allResults.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0);
  const filesRun = allResults.length;
  const filesFailed = allResults.filter(r => !r.success).length;
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary
  console.log('');
  console.log(`${c.bright}${'═'.repeat(60)}${c.reset}`);
  console.log(`${c.bright}  SUMMARY${c.reset}`);
  console.log(`${'═'.repeat(60)}`);
  console.log('');
  console.log(`  ${c.cyan}Files:${c.reset}   ${filesRun} run, ${filesRun - filesFailed} passed, ${filesFailed} failed`);
  console.log(`  ${c.cyan}Tests:${c.reset}   ${totalPassed + totalFailed} run, ${c.green}${totalPassed} passed${c.reset}, ${totalFailed > 0 ? c.red + totalFailed + ' failed' + c.reset : '0 failed'}`);
  console.log(`  ${c.cyan}Time:${c.reset}    ${duration}s`);
  console.log('');

  if (totalFailed > 0) {
    console.log(`${c.red}${c.bright}Some tests failed!${c.reset}`);
    console.log('');

    // Show failed files
    const failedFiles = allResults.filter(r => !r.success);
    if (failedFiles.length > 0) {
      console.log(`${c.red}Failed files:${c.reset}`);
      for (const f of failedFiles) {
        console.log(`  - ${f.file}`);
      }
    }

    process.exit(1);
  } else {
    console.log(`${c.green}${c.bright}All tests passed!${c.reset}`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`${c.red}Error: ${err.message}${c.reset}`);
  process.exit(1);
});
