/**
 * @fileoverview Chat API with LLM integration using AchillesAgentLib
 * @implements URS-007 LLM and UI interface
 */

'use strict';

const path = require('path');
const { createSessionApi } = require('../api/sessionApi');

/**
 * Import LLMAgent from AchillesAgentLib
 * Uses dynamic import for ES modules compatibility
 */
let LLMAgent = null;
let llmAgentReady = null;

async function initLLMAgent() {
  if (llmAgentReady) return llmAgentReady;

  llmAgentReady = (async () => {
    try {
      // Try to import from AchillesAgentLib
      const achillesPath = path.resolve(__dirname, '../../../AchillesAgentLib/LLMAgents/index.mjs');
      const module = await import(achillesPath);
      LLMAgent = module.LLMAgent;
      return true;
    } catch (e) {
      console.warn('Could not load AchillesAgentLib:', e.message);
      return false;
    }
  })();

  return llmAgentReady;
}

/**
 * System prompt for the Spock reasoning assistant
 */
const SYSTEM_PROMPT = `You are a reasoning assistant powered by the Spock Geometric Operating System (GOS).

Spock uses Vector Symbolic Architecture (VSA) to represent knowledge geometrically:
- Concepts are high-dimensional vectors
- Truth is a canonical direction in space
- Logical operations are geometric transformations
- Similarity is measured by cosine distance

You help users:
1. Translate natural language into SpockDSL
2. Execute reasoning queries
3. Explain geometric reasoning results
4. Build logical theories

SpockDSL Syntax:
- @declaration subject Verb object  (create a fact)
- @Theory theory begin ... end      (define a theory)
- @Verb verb begin ... end          (define a custom verb)
- $subject, $object                 (magic variables in verbs)

Core Verbs:
- Is: Bind subject to object role
- Add: Vector addition (evidence accumulation)
- Bind: Create structured composite
- Distance: Cosine similarity (returns scalar)
- Modulate: Scale vector by scalar
- Negate: Flip vector direction
- Move: Translate in space
- Identity: Pass through
- Normalise: Unit length

Example session:
User: "Is Socrates mortal?"
Assistant: Let me check by building the classical syllogism.
\`\`\`spockdsl
@premise1 Humans Is Mortal
@premise2 Socrates Is Human
@query Socrates Is Mortal
@result premise1 Distance query
\`\`\`
The result shows ~85% truth alignment, indicating strong support for the conclusion.

Always explain results in terms of geometric intuition when helpful.`;

/**
 * Creates a chat API with LLM integration
 * @param {Object} engine - SpockEngine instance
 * @param {Object} [options={}] - Configuration
 * @returns {Object} ChatApi instance
 */
function createChatApi(engine, options = {}) {
  const {
    agentName = 'SpockAssistant',
    mode = 'fast',
    systemPrompt = SYSTEM_PROMPT
  } = options;

  let agent = null;
  let session = null;
  let sessionApi = null;
  const conversationHistory = [];

  /**
   * Initializes the LLM agent
   */
  async function initAgent() {
    const ready = await initLLMAgent();
    if (!ready || !LLMAgent) {
      throw new Error('LLM integration not available. Install AchillesAgentLib.');
    }
    agent = new LLMAgent({ name: agentName });
    return agent;
  }

  /**
   * Gets or creates session
   */
  function getSession() {
    if (!session) {
      session = engine.createSession();
      sessionApi = createSessionApi(session);
    }
    return { session, api: sessionApi };
  }

  /**
   * Extracts DSL code blocks from text
   */
  function extractDSLBlocks(text) {
    const blocks = [];
    const regex = /```(?:spockdsl|dsl)?\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      blocks.push(match[1].trim());
    }
    return blocks;
  }

  /**
   * Executes extracted DSL and returns results
   */
  function executeDSL(dslCode) {
    const { api } = getSession();
    return api.ask(dslCode);
  }

  /**
   * Builds prompt with conversation history
   */
  function buildPrompt(userMessage) {
    let prompt = systemPrompt + '\n\n';

    // Add conversation history
    for (const msg of conversationHistory.slice(-10)) {  // Last 10 exchanges
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
    }

    prompt += `User: ${userMessage}\n\nAssistant:`;
    return prompt;
  }

  return {
    /**
     * Sends a message and gets a response
     * @param {string} userMessage - User's message
     * @param {Object} [opts={}] - Options
     * @returns {Promise<Object>} Response with text and optional DSL results
     */
    async chat(userMessage, opts = {}) {
      const { executeCode = true } = opts;

      // Ensure agent is initialized
      if (!agent) {
        await initAgent();
      }

      // Add user message to history
      conversationHistory.push({ role: 'user', content: userMessage });

      // Build prompt and get response
      const prompt = buildPrompt(userMessage);

      const response = await agent.executePrompt(prompt, {
        mode: opts.mode || mode,
        ...opts
      });

      // Add assistant response to history
      conversationHistory.push({ role: 'assistant', content: response });

      // Extract and execute any DSL blocks if requested
      let dslResults = [];
      if (executeCode) {
        const dslBlocks = extractDSLBlocks(response);
        for (const block of dslBlocks) {
          try {
            const result = executeDSL(block);
            dslResults.push({ code: block, result });
          } catch (e) {
            dslResults.push({ code: block, error: e.message });
          }
        }
      }

      return {
        response,
        dslResults,
        history: conversationHistory.length
      };
    },

    /**
     * Asks a specific reasoning question
     * @param {string} question - Natural language question
     * @returns {Promise<Object>} Response with reasoning
     */
    async reason(question) {
      const reasoningPrompt = `
The user wants to reason about: "${question}"

Please:
1. Identify the key concepts and relationships
2. Write SpockDSL to represent and query this
3. Explain what the geometric result means

Format your DSL code in \`\`\`spockdsl blocks.`;

      return this.chat(reasoningPrompt, { executeCode: true });
    },

    /**
     * Translates natural language to DSL
     * @param {string} naturalLanguage - Natural language statement
     * @returns {Promise<string>} DSL code
     */
    async translateToDSL(naturalLanguage) {
      if (!agent) {
        await initAgent();
      }

      const prompt = `Translate this to SpockDSL (respond with ONLY the DSL code, no explanation):

"${naturalLanguage}"

SpockDSL:`;

      const response = await agent.executePrompt(prompt, { mode });

      // Extract code or return as-is
      const blocks = extractDSLBlocks(response);
      return blocks.length > 0 ? blocks[0] : response.trim();
    },

    /**
     * Explains a DSL result in natural language
     * @param {Object} result - Result from session API
     * @returns {Promise<string>} Natural language explanation
     */
    async explainResult(result) {
      if (!agent) {
        await initAgent();
      }

      const prompt = `Explain this Spock reasoning result in plain English:

Success: ${result.success}
Truth Score: ${result.scores?.truth?.toFixed(3) || 'N/A'}
Confidence: ${result.scores?.confidence?.toFixed(3) || 'N/A'}
DSL Output: ${result.dslOutput || 'N/A'}
${result.error ? `Error: ${result.error}` : ''}

Provide a clear, concise explanation of what this means:`;

      return agent.executePrompt(prompt, { mode });
    },

    /**
     * Gets conversation history
     * @returns {Array} History entries
     */
    getHistory() {
      return [...conversationHistory];
    },

    /**
     * Clears conversation history
     */
    clearHistory() {
      conversationHistory.length = 0;
    },

    /**
     * Resets session and history
     */
    reset() {
      session = null;
      sessionApi = null;
      conversationHistory.length = 0;
    },

    /**
     * Gets the underlying session API
     * @returns {Object} SessionApi
     */
    getSessionApi() {
      return getSession().api;
    },

    /**
     * Checks if LLM is available
     * @returns {Promise<boolean>}
     */
    async isLLMAvailable() {
      return initLLMAgent();
    }
  };
}

/**
 * Creates a simple REPL for interactive chat
 * @param {Object} engine - SpockEngine instance
 * @param {Object} [options={}] - Configuration
 */
async function startChatREPL(engine, options = {}) {
  const readline = require('readline');
  const chat = createChatApi(engine, options);

  const available = await chat.isLLMAvailable();
  if (!available) {
    console.log('LLM not available. Running in DSL-only mode.');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\n🖖 Spock> '
  });

  console.log('\nSpock GOS Chat');
  console.log('==============');
  console.log('Commands:');
  console.log('  /dsl <code>  - Execute DSL directly');
  console.log('  /clear       - Clear history');
  console.log('  /exit        - Exit');
  console.log('');

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input === '/exit' || input === '/quit') {
      console.log('Live long and prosper 🖖');
      rl.close();
      return;
    }

    if (input === '/clear') {
      chat.clearHistory();
      console.log('History cleared.');
      rl.prompt();
      return;
    }

    if (input.startsWith('/dsl ')) {
      const dsl = input.slice(5);
      const api = chat.getSessionApi();
      const result = api.ask(dsl);
      console.log('\nResult:', result.success ? 'Success' : 'Failed');
      if (result.scores) {
        console.log(`Truth: ${(result.scores.truth * 100).toFixed(1)}%`);
      }
      if (result.error) {
        console.log('Error:', result.error);
      }
      rl.prompt();
      return;
    }

    try {
      if (available) {
        const response = await chat.chat(input);
        console.log('\n' + response.response);

        if (response.dslResults.length > 0) {
          console.log('\n--- DSL Results ---');
          for (const r of response.dslResults) {
            if (r.result?.success) {
              console.log(`Truth: ${(r.result.scores.truth * 100).toFixed(1)}%`);
            } else if (r.error) {
              console.log('Error:', r.error);
            }
          }
        }
      } else {
        // DSL-only mode
        const api = chat.getSessionApi();
        const result = api.ask(input);
        console.log('\nResult:', result.success ? 'Success' : 'Failed');
        if (result.scores) {
          console.log(`Truth: ${(result.scores.truth * 100).toFixed(1)}%`);
        }
        if (result.dslOutput) {
          console.log('Output:', result.dslOutput);
        }
        if (result.error) {
          console.log('Error:', result.error);
        }
      }
    } catch (e) {
      console.log('Error:', e.message);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

module.exports = {
  createChatApi,
  startChatREPL,
  SYSTEM_PROMPT
};
