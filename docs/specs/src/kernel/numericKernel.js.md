# DS src/kernel/numericKernel.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Represent numeric runtime values (scalars, vectors, units, measured values) and implement basic numeric verbs. |
| **Public functions** | `makeNumeric(value)`, `addNumeric(a, b)`, `subNumeric(a, b)`, `mulNumeric(a, b)`, `divNumeric(a, b)`, `attachUnit(numeric, unitSymbol)`, `projectUnit(measured)` |
| **Depends on** | Pure JavaScript (optionally `src/config/config.js` for defaults) |
| **Used by** | `src/dsl/executor.js`, numeric and physics theories |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-003 Geometric and numeric representation |
| **Implements FS** | FS-05 Numeric data types and units |
| **Implements DS** | DS Numeric kernel and physical quantities |

## Data Types

### NumericValue

```javascript
{
  type: 'numeric',
  value: number | number[],  // Scalar or vector
  unit: string | null        // Unit symbol or null
}
```

### MeasuredValue

```javascript
{
  type: 'measured',
  value: number | number[],
  unit: string,
  concept: string | null     // Optional linked concept
}
```

## Function Specifications

### `makeNumeric(value)`

Wraps a JavaScript number into a NumericValue structure.

**Parameters:**
- `value` (number): Raw numeric value

**Returns:**
- NumericValue object with no unit

**DSL Mapping:** `HasNumericValue` verb

### `addNumeric(a, b)`

Adds two numeric values with unit compatibility checking.

**Parameters:**
- `a` (NumericValue): First operand
- `b` (NumericValue): Second operand

**Returns:**
- NumericValue with sum

**DSL Mapping:** `AddNumeric` verb

**Constraints:**
- Units must be compatible (same or convertible)
- Throws error on incompatible units

### `subNumeric(a, b)`

Subtracts two numeric values with unit compatibility checking.

**Parameters:**
- `a` (NumericValue): First operand
- `b` (NumericValue): Second operand

**Returns:**
- NumericValue with difference

**DSL Mapping:** `SubNumeric` verb

### `mulNumeric(a, b)`

Multiplies two numeric values, composing units.

**Parameters:**
- `a` (NumericValue): First operand
- `b` (NumericValue): Second operand

**Returns:**
- NumericValue with product and composed unit

**DSL Mapping:** `MulNumeric` verb

**Example:**
- `kg * m_per_s2 = N` (Newton)

### `divNumeric(a, b)`

Divides two numeric values, composing units.

**Parameters:**
- `a` (NumericValue): Dividend
- `b` (NumericValue): Divisor

**Returns:**
- NumericValue with quotient and composed unit

**DSL Mapping:** `DivNumeric` verb

**Example:**
- `m / s = m_per_s`

### `attachUnit(numeric, unitSymbol)`

Attaches a unit symbol to a numeric value.

**Parameters:**
- `numeric` (NumericValue): Value without unit
- `unitSymbol` (string): Unit symbol (e.g., 'kg', 'm', 's')

**Returns:**
- NumericValue with unit attached

**DSL Mapping:** `AttachUnit` verb

### `projectUnit(measured)`

Extracts the unit from a measured value.

**Parameters:**
- `measured` (MeasuredValue): Value with unit

**Returns:**
- string: The unit symbol

**DSL Mapping:** `ProjectNumeric` verb (partial)

## Unit Composition Rules

| Operation | Unit Result |
|-----------|-------------|
| `m * m` | `m2` |
| `m / s` | `m_per_s` |
| `kg * m_per_s2` | `N` |
| `N * m` | `J` |
