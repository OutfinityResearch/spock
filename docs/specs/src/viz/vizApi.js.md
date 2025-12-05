# DS src/viz/vizApi.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | HTTP server for visualization - provides web UI and REST API for executing DSL and visualizing concept space. |
| **Public functions** | `createVizServer(engine, options)` |
| **Depends on** | `src/viz/projectionService.js`, `src/api/sessionApi.js`, Node.js `http` module |
| **Used by** | External tools, demo applications |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-006 Implementation platform, URS-007 LLM interface |
| **Implements FS** | FS-06 Public API |
| **Implements DS** | DS Visualisation |

## Function Specifications

### `createVizServer(engine, options)`

Creates an HTTP visualization server.

**Parameters:**
- `engine` (SpockEngine): Engine instance to serve
- `options` (object): Server options
  - `port` (number): Port to listen on (default: 3000)
  - `host` (string): Host to bind to (default: 'localhost')
  - `enableWebSocket` (boolean): Enable WebSocket for real-time updates (default: false)

**Returns:**
- Server object with `start()`, `stop()`, `getAddress()` methods

## REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | HTML UI for interactive demo |
| GET | `/viz/concepts` | Get current concepts projected to 2D/3D |
| GET | `/viz/trajectory` | Get execution trajectory (planned) |
| POST | `/viz/execute` | Execute DSL script and return result + visualization |
| GET | `/viz/theories` | List available theories |
| GET | `/viz/methods` | List available projection methods |
| POST | `/viz/reset` | Reset session state |

### POST /viz/execute

**Request Body:**
```json
{
  "script": "@fact Socrates Is Human",
  "method": "ask"
}
```

**Response:**
```json
{
  "result": {
    "success": true,
    "dslOutput": "...",
    "scores": { "truth": 0.85, "confidence": 0.9 }
  },
  "points": [
    { "id": "Socrates", "x": 0.3, "y": -0.2 },
    { "id": "Truth", "x": 0.9, "y": 0.1 }
  ]
}
```

## HTML UI

Provides a built-in web interface with:
- DSL input textarea
- Method selector (learn/ask/prove/explain/plan/solve)
- Canvas for 2D concept space visualization
- Truth/Confidence score display
- Grid-based visualization with color coding:
  - Green: Concepts
  - Red: Truth
  - Blue: False
  - Gray: Zero
