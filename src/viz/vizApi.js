/**
 * @fileoverview HTTP/WebSocket server for visualization
 * @implements URS-006, URS-007, FS-06, DS Visualisation
 */

'use strict';

const http = require('http');
const { URL } = require('url');
const { projectVectors, getAvailableMethods } = require('./projectionService');
const { createSessionApi } = require('../api/sessionApi');

/**
 * Simple HTML UI for demos
 */
const HTML_UI = `<!DOCTYPE html>
<html>
<head>
  <title>Spock GOS Visualizer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: monospace; background: #1a1a2e; color: #eee; padding: 20px; }
    .container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 1400px; margin: 0 auto; }
    h1 { color: #00d4ff; margin-bottom: 20px; text-align: center; grid-column: span 2; }
    .panel { background: #16213e; border-radius: 8px; padding: 20px; }
    textarea { width: 100%; height: 200px; background: #0f0f23; color: #00ff00; border: 1px solid #333; padding: 10px; font-family: monospace; resize: vertical; }
    button { background: #00d4ff; color: #000; border: none; padding: 10px 20px; cursor: pointer; font-weight: bold; margin: 10px 5px 10px 0; }
    button:hover { background: #00a8cc; }
    select { background: #0f0f23; color: #eee; border: 1px solid #333; padding: 8px; }
    .result { background: #0f0f23; padding: 15px; margin-top: 15px; border-radius: 4px; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
    .success { border-left: 3px solid #00ff00; }
    .error { border-left: 3px solid #ff4444; }
    canvas { background: #0f0f23; border-radius: 4px; }
    .scores { display: flex; gap: 20px; margin-top: 15px; }
    .score { background: #0f0f23; padding: 10px 20px; border-radius: 4px; }
    .score-label { color: #888; font-size: 12px; }
    .score-value { font-size: 24px; color: #00d4ff; }
    .legend { margin-top: 10px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🖖 Spock GOS Visualizer</h1>

    <div class="panel">
      <h3>DSL Input</h3>
      <textarea id="dsl" placeholder="@fact Socrates Is Human">@BasicLogicSession session begin
    @p1 Humans Is Mortal
    @p2 Socrates Is Human
    @conclusion Socrates Is Mortal
    @result p1 Distance conclusion
end</textarea>
      <div>
        <select id="method">
          <option value="learn">learn</option>
          <option value="ask" selected>ask</option>
          <option value="prove">prove</option>
        </select>
        <button onclick="execute()">Execute</button>
        <button onclick="clearAll()">Clear</button>
      </div>
      <div class="result" id="output"></div>
      <div class="scores" id="scores"></div>
    </div>

    <div class="panel">
      <h3>Concept Space (PCA 2D)</h3>
      <canvas id="canvas" width="500" height="500"></canvas>
      <div class="legend">
        <span style="color:#00ff00">● Concepts</span> |
        <span style="color:#ff4444">● Truth</span> |
        <span style="color:#4444ff">● False</span>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    function drawPoints(points) {
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const pos = i * 50;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, 500);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(500, pos);
        ctx.stroke();
      }

      // Draw axes
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(250, 0);
      ctx.lineTo(250, 500);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 250);
      ctx.lineTo(500, 250);
      ctx.stroke();

      // Draw points
      for (const p of points) {
        const x = 250 + p.x * 200;
        const y = 250 - p.y * 200;

        let color = '#00ff00';
        if (p.id === 'Truth') color = '#ff4444';
        else if (p.id === 'False') color = '#4444ff';
        else if (p.id === 'Zero') color = '#888888';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '11px monospace';
        ctx.fillText(p.id, x + 10, y + 4);
      }
    }

    async function execute() {
      const dsl = document.getElementById('dsl').value;
      const method = document.getElementById('method').value;

      try {
        const res = await fetch('/viz/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: dsl, method })
        });
        const data = await res.json();

        const output = document.getElementById('output');
        if (data.result.success) {
          output.className = 'result success';
          output.textContent = data.result.dslOutput || 'Success';
        } else {
          output.className = 'result error';
          output.textContent = 'Error: ' + data.result.error;
        }

        const scores = document.getElementById('scores');
        if (data.result.scores) {
          scores.innerHTML = \`
            <div class="score">
              <div class="score-label">Truth Score</div>
              <div class="score-value">\${(data.result.scores.truth * 100).toFixed(1)}%</div>
            </div>
            <div class="score">
              <div class="score-label">Confidence</div>
              <div class="score-value">\${(data.result.scores.confidence * 100).toFixed(1)}%</div>
            </div>
          \`;
        }

        if (data.points) {
          drawPoints(data.points);
        }
      } catch (e) {
        document.getElementById('output').className = 'result error';
        document.getElementById('output').textContent = 'Network error: ' + e.message;
      }
    }

    function clearAll() {
      document.getElementById('dsl').value = '';
      document.getElementById('output').textContent = '';
      document.getElementById('scores').innerHTML = '';
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Initial draw
    drawPoints([]);
  </script>
</body>
</html>`;

/**
 * Creates visualization server
 * @param {Object} engine - SpockEngine instance
 * @param {Object} [options={}] - Server options
 * @returns {Object} Server with start/stop methods
 */
function createVizServer(engine, options = {}) {
  const {
    port = 3000,
    host = 'localhost',
    enableWebSocket = false
  } = options;

  let server = null;
  let currentSession = null;
  let sessionApi = null;

  /**
   * Gets or creates current session
   */
  function getSession() {
    if (!currentSession) {
      currentSession = engine.createSession();
      sessionApi = createSessionApi(currentSession);
    }
    return { session: currentSession, api: sessionApi };
  }

  /**
   * Extracts vectors from session for visualization
   */
  function getSessionVectors(session) {
    const vectors = [];

    // Add global symbols
    const globals = engine.getGlobalSymbols();
    for (const [name, value] of globals) {
      if (value.type === 'VECTOR') {
        vectors.push({ id: name, vec: value.value });
      }
    }

    // Add local symbols
    for (const [name, value] of session.localSymbols) {
      if (value.type === 'VECTOR') {
        vectors.push({ id: name, vec: value.value });
      }
    }

    return vectors;
  }

  /**
   * Handles HTTP requests
   */
  function handleRequest(req, res) {
    const url = new URL(req.url, `http://${host}:${port}`);
    const pathname = url.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Routes
    if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(HTML_UI);
      return;
    }

    if (pathname === '/viz/concepts' && req.method === 'GET') {
      const methodParam = url.searchParams.get('method') || 'pca2d';
      const { session } = getSession();
      const vectors = getSessionVectors(session);
      const points = projectVectors(vectors, methodParam);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ points, method: methodParam }));
      return;
    }

    if (pathname === '/viz/trajectory' && req.method === 'GET') {
      const { session } = getSession();
      // TODO: Implement trajectory tracking
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ steps: [], points: [] }));
      return;
    }

    if (pathname === '/viz/execute' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { script, method = 'ask' } = JSON.parse(body);
          const { api, session } = getSession();

          // Execute via appropriate API method
          let result;
          switch (method) {
            case 'learn':
              result = api.learn(script);
              break;
            case 'ask':
              result = api.ask(script);
              break;
            case 'prove':
              result = api.prove(script);
              break;
            case 'explain':
              result = api.explain(script);
              break;
            case 'plan':
              result = api.plan(script);
              break;
            case 'solve':
              result = api.solve(script);
              break;
            default:
              result = api.ask(script);
          }

          // Get visualization data
          const vectors = getSessionVectors(session);
          const points = projectVectors(vectors, 'pca2d');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result, points }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (pathname === '/viz/theories' && req.method === 'GET') {
      const theories = engine.listTheories();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ theories }));
      return;
    }

    if (pathname === '/viz/methods' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ methods: getAvailableMethods() }));
      return;
    }

    if (pathname === '/viz/reset' && req.method === 'POST') {
      currentSession = null;
      sessionApi = null;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  return {
    /**
     * Starts the server
     * @returns {Promise<void>}
     */
    start() {
      return new Promise((resolve, reject) => {
        server = http.createServer(handleRequest);
        server.on('error', reject);
        server.listen(port, host, () => {
          console.log(`Spock Viz Server running at http://${host}:${port}`);
          resolve();
        });
      });
    },

    /**
     * Stops the server
     * @returns {Promise<void>}
     */
    stop() {
      return new Promise((resolve) => {
        if (server) {
          server.close(() => {
            server = null;
            currentSession = null;
            sessionApi = null;
            resolve();
          });
        } else {
          resolve();
        }
      });
    },

    /**
     * Gets server address
     * @returns {string|null}
     */
    getAddress() {
      if (server) {
        const addr = server.address();
        return `http://${addr.address}:${addr.port}`;
      }
      return null;
    }
  };
}

module.exports = {
  createVizServer
};
