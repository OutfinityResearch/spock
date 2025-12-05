# DS tests/kernel/numericKernel.test.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Unit tests for `src/kernel/numericKernel.js`. |
| **Test style** | Pure unit tests. |
| **Functions under test** | `makeNumeric`, `addNumeric`, `subNumeric`, `mulNumeric`, `divNumeric`, `attachUnit`, `projectUnit`. |

## Test Cases

### makeNumeric

| Test | Input | Expected |
|------|-------|----------|
| Wrap integer | `makeNumeric(5)` | `{ value: 5, unit: null }` |
| Wrap float | `makeNumeric(3.14)` | `{ value: 3.14, unit: null }` |
| Wrap negative | `makeNumeric(-10)` | `{ value: -10, unit: null }` |

### addNumeric

| Test | Input | Expected |
|------|-------|----------|
| Same units | `5 m + 3 m` | `8 m` |
| No units | `5 + 3` | `8` |
| Incompatible units | `5 m + 3 kg` | Error |

### subNumeric

| Test | Input | Expected |
|------|-------|----------|
| Same units | `10 m - 3 m` | `7 m` |
| No units | `10 - 3` | `7` |
| Incompatible units | `10 m - 3 s` | Error |

### mulNumeric

| Test | Input | Expected |
|------|-------|----------|
| Unit composition | `5 m * 3 m` | `15 m2` |
| Force calculation | `10 kg * 9.8 m_per_s2` | `98 N` |
| No units | `5 * 3` | `15` |

### divNumeric

| Test | Input | Expected |
|------|-------|----------|
| Speed calculation | `100 m / 10 s` | `10 m_per_s` |
| Cancel units | `10 m / 2 m` | `5` (unitless) |
| Division by zero | `10 / 0` | Error or Infinity |

### attachUnit

| Test | Input | Expected |
|------|-------|----------|
| Attach to numeric | `attachUnit(5, 'kg')` | `{ value: 5, unit: 'kg' }` |
| Override unit | `attachUnit(5 m, 'kg')` | `{ value: 5, unit: 'kg' }` |

### projectUnit

| Test | Input | Expected |
|------|-------|----------|
| Extract unit | `projectUnit(5 kg)` | `'kg'` |
| No unit | `projectUnit(5)` | `null` |

## Unit Composition Tests

| Operation | Result |
|-----------|--------|
| `m * m` | `m2` |
| `m / s` | `m_per_s` |
| `kg * m_per_s2` | `N` |
| `N * m` | `J` |
| `J / s` | `W` |

## Scope

- No I/O
- Tests should fully specify expected runtime structures
- Test unit compatibility errors explicitly
