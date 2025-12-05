/**
 * @fileoverview Main entry point for Spock GOS
 */

'use strict';

const { createSpockEngine } = require('./api/engineFactory');
const { createSessionApi } = require('./api/sessionApi');
const { parse } = require('./dsl/parser');
const { getConfig, setConfig, initConfig } = require('./config/config');

module.exports = {
  // Main API
  createSpockEngine,
  createSessionApi,

  // DSL
  parse,

  // Config
  getConfig,
  setConfig,
  initConfig,

  // Re-export for advanced usage
  kernel: {
    vectorSpace: require('./kernel/vectorSpace'),
    primitiveOps: require('./kernel/primitiveOps'),
    numericKernel: require('./kernel/numericKernel')
  },

  dsl: {
    tokenizer: require('./dsl/tokenizer'),
    parser: require('./dsl/parser'),
    dependencyGraph: require('./dsl/dependencyGraph'),
    executor: require('./dsl/executor')
  },

  session: {
    sessionManager: require('./session/sessionManager')
  },

  theory: {
    theoryStore: require('./theory/theoryStore')
  },

  logging: {
    traceLogger: require('./logging/traceLogger')
  },

  viz: {
    projectionService: require('./viz/projectionService'),
    vizApi: require('./viz/vizApi')
  },

  chat: {
    chatApi: require('./chat/chatApi')
  },

  eval: {
    evalRunner: require('./eval/evalRunner')
  }
};
