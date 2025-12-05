# DS src/viz/vizApi.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Provide HTTP / WebSocket endpoints for visualisation (concept projections, trajectories) and a simple interactive UI for demos and debugging. |
| **Public functions** | `createVizServer(engine, options)` |
| **Depends on** | `src/viz/projectionService.js`, `src/api/sessionApi.js`, `src/api/engineFactory.js`, Node.js HTTP/WS libraries |
| **Used by** | Front-end visualisation clients, developers during debugging and demos |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-006 Implementation platform, URS-007 LLM and UI interface |
| **Implements FS** | FS-06 Public API (viz side) |
| **Implements DS** | DS Visualisation and interaction |

## Server Options

```javascript
{
  port: number,            // HTTP port (default: 3000)
  host: string,            // Bind address (default: 'localhost')
  enableWebSocket: boolean // Enable WS for real-time updates
}
```

## API Endpoints

### `GET /viz/concepts`

Returns projected coordinates for all concepts in the current session.

**Response:**
```json
{
  "points": [
    { "id": "Socrates", "x": 0.5, "y": 0.3 },
    { "id": "Human", "x": 0.2, "y": 0.8 }
  ],
  "method": "pca2d"
}
```

### `GET /viz/trajectory`

Returns the reasoning trajectory for the current session.

**Response:**
```json
{
  "steps": [
    { "index": 0, "from": "start", "to": "fact1", "verb": "Is" },
    { "index": 1, "from": "fact1", "to": "query", "verb": "Implies" }
  ],
  "points": [
    { "id": "start", "x": 0, "y": 0 },
    { "id": "fact1", "x": 0.5, "y": 0.3 }
  ]
}
```

### `POST /viz/execute`

Executes a DSL script and returns results with visualisation data.

**Request:**
```json
{
  "script": "@fact1 Socrates Is Human",
  "method": "ask"
}
```

**Response:**
```json
{
  "result": { "success": true, "scores": { "truth": 0.95 } },
  "points": [...],
  "trajectory": [...]
}
```

### `GET /viz/theories`

Lists available theories.

**Response:**
```json
{
  "theories": ["BasicLogic", "Physics", "CustomTheory"]
}
```

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `execute` | client→server | Execute DSL script |
| `result` | server→client | Execution result |
| `update` | server→client | Real-time concept updates |

## Simple UI

The server can serve a basic HTML UI at `/`:
- DSL input textarea
- Execute button
- 2D scatter plot of concepts
- Trajectory overlay
- Theory/session selector

## Function Specification

### `createVizServer(engine, options)`

Creates and starts the visualisation server.

**Parameters:**
- `engine` (SpockEngine): Engine instance
- `options` (ServerOptions): Configuration

**Returns:**
- Server object with `start()`, `stop()` methods
