# DS tests/viz/projectionService.test.js

## Overview

| Field | Value |
|-------|-------|
| **Tests for** | `src/viz/projectionService.js` |
| **Focus** | PCA and linear projection algorithms, coordinate normalization |
| **Status** | Planned - not yet implemented |

## Test Cases

### PCA 2D Projection

```javascript
test('pca2d projects vectors to 2D with correct structure', () => {
  const vectors = [
    { id: 'A', vec: new Float32Array([1, 0, 0, 0]) },
    { id: 'B', vec: new Float32Array([0, 1, 0, 0]) },
    { id: 'C', vec: new Float32Array([1, 1, 0, 0]) }
  ];
  const points = pca2d(vectors);

  assert(points.length === 3);
  assert(points.every(p => 'x' in p && 'y' in p && 'id' in p));
});

test('pca2d handles single vector', () => {
  const vectors = [{ id: 'A', vec: new Float32Array([1, 2, 3]) }];
  const points = pca2d(vectors);

  assert(points.length === 1);
  assert(points[0].x === 0 && points[0].y === 0);
});

test('pca2d handles empty array', () => {
  const points = pca2d([]);
  assert(points.length === 0);
});
```

### Linear Projection

```javascript
test('linear2d uses first two dimensions', () => {
  const vectors = [
    { id: 'A', vec: new Float32Array([0.5, -0.3, 0.1, 0.2]) }
  ];
  const points = linear2d(vectors);

  assert(points[0].x === 0.5);
  assert(points[0].y === -0.3);
});
```

### Normalization

```javascript
test('normalizePoints2d scales to [-1, 1] range', () => {
  const points = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 100, y: -50 }
  ];
  const normalized = normalizePoints2d(points);

  assert(normalized.every(p => p.x >= -1 && p.x <= 1));
  assert(normalized.every(p => p.y >= -1 && p.y <= 1));
});
```

### Method Registry

```javascript
test('getAvailableMethods returns all methods', () => {
  const methods = getAvailableMethods();

  assert(methods.includes('pca2d'));
  assert(methods.includes('pca3d'));
  assert(methods.includes('linear2d'));
  assert(methods.includes('linear3d'));
});

test('projectVectors throws for unknown method', () => {
  assertThrows(() => projectVectors([], 'unknown_method'));
});
```
