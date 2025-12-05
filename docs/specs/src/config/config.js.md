# DS src/config/config.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Central configuration for vector dimensions, numeric types, file paths, evaluation suite paths and visualisation settings. |
| **Public functions** | `getConfig()`, `setConfig(partialConfig)` |
| **Depends on** | None |
| **Used by** | `src/kernel/vectorSpace.js`, `src/theory/theoryStore.js`, `src/eval/taskLoader.js`, `src/api/engineFactory.js`, `src/viz/vizApi.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-006 Implementation platform |
| **Implements FS** | FS-01 Core conceptual model (parameters) |
| **Implements DS** | DS Kernel architecture |

## Configuration Schema

```javascript
{
  // Vector space settings
  dimensions: number,          // Default: 512
  numericType: string,         // 'float32' | 'float64'

  // Paths
  workingFolder: string,       // Default: '.spock'
  theoriesPath: string,        // Default: '.spock/theories'
  evalSuitePath: string,       // Default: 'evalSuite'

  // Logging
  logLevel: string,            // 'silent' | 'summary' | 'full'
  traceEnabled: boolean,       // Default: true

  // Visualisation
  vizPort: number,             // Default: 3000
  vizHost: string,             // Default: 'localhost'

  // Limits
  maxRecursion: number,        // Default: 100
  maxIterations: number,       // Default: 1000
  timeout: number              // Default: 30000 (ms)
}
```

## Default Values

```javascript
const DEFAULTS = {
  dimensions: 512,
  numericType: 'float32',
  workingFolder: '.spock',
  theoriesPath: '.spock/theories',
  evalSuitePath: 'evalSuite',
  logLevel: 'summary',
  traceEnabled: true,
  vizPort: 3000,
  vizHost: 'localhost',
  maxRecursion: 100,
  maxIterations: 1000,
  timeout: 30000
};
```

## Function Specifications

### `getConfig()`

Returns the current configuration object.

**Returns:**
- Complete configuration object (frozen/immutable copy)

**Behaviour:**
- Merges defaults with any user overrides
- Returns immutable copy to prevent accidental modification

### `setConfig(partialConfig)`

Updates configuration with partial overrides.

**Parameters:**
- `partialConfig` (object): Partial configuration to merge

**Behaviour:**
- Merges with existing config
- Validates values (e.g., dimensions must be power of 2)
- Does not persist to disk

**Example:**
```javascript
setConfig({ dimensions: 1024, logLevel: 'full' });
```

## Environment Variables

The config module can read from environment variables:

| Variable | Config Key |
|----------|------------|
| `SPOCK_DIMENSIONS` | `dimensions` |
| `SPOCK_LOG_LEVEL` | `logLevel` |
| `SPOCK_WORKING_FOLDER` | `workingFolder` |

## Validation Rules

| Key | Constraint |
|-----|------------|
| `dimensions` | Power of 2, ≥ 64 |
| `numericType` | 'float32' or 'float64' |
| `logLevel` | 'silent', 'summary', or 'full' |
| `maxRecursion` | Positive integer |
| `timeout` | Positive integer (ms) |
