# DS tests/viz/vizApi.smoke.test.js

## Overview

| Field | Value |
|-------|-------|
| **Tests for** | `src/viz/vizApi.js` |
| **Focus** | HTTP server startup/shutdown, basic endpoint responses |
| **Status** | Planned - not yet implemented |

## Test Cases

### Server Lifecycle

```javascript
test('createVizServer returns server object', () => {
  const engine = createSpockEngine();
  const server = createVizServer(engine, { port: 0 });

  assert(typeof server.start === 'function');
  assert(typeof server.stop === 'function');
  assert(typeof server.getAddress === 'function');
});

test('server starts and stops cleanly', async () => {
  const engine = createSpockEngine();
  const server = createVizServer(engine, { port: 0 });

  await server.start();
  const addr = server.getAddress();
  assert(addr !== null);

  await server.stop();
  assert(server.getAddress() === null);
});
```

### Endpoint Smoke Tests

```javascript
test('GET / returns HTML', async () => {
  const server = await startTestServer();
  const res = await fetch(server.getAddress() + '/');

  assert(res.status === 200);
  assert(res.headers.get('content-type').includes('text/html'));

  await server.stop();
});

test('GET /viz/concepts returns JSON', async () => {
  const server = await startTestServer();
  const res = await fetch(server.getAddress() + '/viz/concepts');

  assert(res.status === 200);
  const data = await res.json();
  assert(Array.isArray(data.points));

  await server.stop();
});

test('POST /viz/execute processes DSL', async () => {
  const server = await startTestServer();
  const res = await fetch(server.getAddress() + '/viz/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script: '@f a Is b', method: 'learn' })
  });

  assert(res.status === 200);
  const data = await res.json();
  assert('result' in data);
  assert('points' in data);

  await server.stop();
});

test('GET /viz/methods returns available methods', async () => {
  const server = await startTestServer();
  const res = await fetch(server.getAddress() + '/viz/methods');

  assert(res.status === 200);
  const data = await res.json();
  assert(data.methods.includes('pca2d'));

  await server.stop();
});

test('POST /viz/reset clears session', async () => {
  const server = await startTestServer();
  const res = await fetch(server.getAddress() + '/viz/reset', { method: 'POST' });

  assert(res.status === 200);
  const data = await res.json();
  assert(data.success === true);

  await server.stop();
});
```

### Error Handling

```javascript
test('404 for unknown paths', async () => {
  const server = await startTestServer();
  const res = await fetch(server.getAddress() + '/unknown/path');

  assert(res.status === 404);

  await server.stop();
});

test('400 for invalid JSON in execute', async () => {
  const server = await startTestServer();
  const res = await fetch(server.getAddress() + '/viz/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not json'
  });

  assert(res.status === 400);

  await server.stop();
});
```
