# DS tests/config/config.test.js

## Overview

| Field | Value |
|-------|-------|
| **Tests for** | `src/config/config.js` |
| **Focus** | Configuration validation, defaults, environment variables |
| **Status** | Planned - not yet implemented |

## Test Cases

### Default Values

```javascript
test('getConfig returns defaults initially', () => {
  resetConfig();
  const config = getConfig();

  assertEqual(config.dimensions, 512);
  assertEqual(config.numericType, 'float32');
  assertEqual(config.vectorGeneration, 'gaussian');
  assertEqual(config.logLevel, 'summary');
  assertEqual(config.planningEpsilon, 0.05);
});

test('getConfig returns frozen object', () => {
  const config = getConfig();
  assertThrows(() => { config.dimensions = 1024; });
});
```

### setConfig Validation

```javascript
test('setConfig validates dimensions is power of 2', () => {
  assertThrows(() => setConfig({ dimensions: 100 }));
  assertThrows(() => setConfig({ dimensions: 63 }));
  assertNotThrows(() => setConfig({ dimensions: 128 }));
  assertNotThrows(() => setConfig({ dimensions: 1024 }));
});

test('setConfig validates numericType', () => {
  assertThrows(() => setConfig({ numericType: 'invalid' }));
  assertNotThrows(() => setConfig({ numericType: 'float64' }));
  assertNotThrows(() => setConfig({ numericType: 'int32' }));
});

test('setConfig validates logLevel', () => {
  assertThrows(() => setConfig({ logLevel: 'debug' }));
  assertNotThrows(() => setConfig({ logLevel: 'silent' }));
  assertNotThrows(() => setConfig({ logLevel: 'full' }));
});

test('setConfig validates planningEpsilon in (0, 1)', () => {
  assertThrows(() => setConfig({ planningEpsilon: 0 }));
  assertThrows(() => setConfig({ planningEpsilon: 1 }));
  assertThrows(() => setConfig({ planningEpsilon: -0.1 }));
  assertNotThrows(() => setConfig({ planningEpsilon: 0.01 }));
});

test('setConfig rejects unknown keys', () => {
  assertThrows(() => setConfig({ unknownKey: 'value' }));
});
```

### resetConfig

```javascript
test('resetConfig restores defaults', () => {
  setConfig({ dimensions: 1024, logLevel: 'full' });
  resetConfig();

  const config = getConfig();
  assertEqual(config.dimensions, 512);
  assertEqual(config.logLevel, 'summary');
});
```

### TypedArray Helpers

```javascript
test('getTypedArrayConstructor returns correct constructor', () => {
  setConfig({ numericType: 'float32' });
  assertEqual(getTypedArrayConstructor(), Float32Array);

  setConfig({ numericType: 'int16' });
  assertEqual(getTypedArrayConstructor(), Int16Array);
});

test('getNumericRange returns correct ranges', () => {
  setConfig({ numericType: 'int8' });
  const range = getNumericRange();
  assertEqual(range.min, -128);
  assertEqual(range.max, 127);
  assertEqual(range.isSigned, true);
  assertEqual(range.isFloat, false);
});

test('isFloatType distinguishes float and int types', () => {
  setConfig({ numericType: 'float32' });
  assert(isFloatType() === true);

  setConfig({ numericType: 'int32' });
  assert(isFloatType() === false);
});
```

### Environment Variables

```javascript
test('initConfig reads from environment', () => {
  process.env.SPOCK_DIMENSIONS = '1024';
  process.env.SPOCK_LOG_LEVEL = 'full';

  initConfig();
  const config = getConfig();

  assertEqual(config.dimensions, 1024);
  assertEqual(config.logLevel, 'full');

  delete process.env.SPOCK_DIMENSIONS;
  delete process.env.SPOCK_LOG_LEVEL;
});

test('initConfig overrides take precedence over env', () => {
  process.env.SPOCK_DIMENSIONS = '1024';

  initConfig({ dimensions: 2048 });
  const config = getConfig();

  assertEqual(config.dimensions, 2048);

  delete process.env.SPOCK_DIMENSIONS;
});
```
