# DS src/dsl/parser.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Convert token streams into an AST of statements and macros; enforce the header form and statement form of the DSL. |
| **Public functions** | `parseScript(text)`, `parseMacro(tokens, startIndex)` |
| **Depends on** | `src/dsl/tokenizer.js` |
| **Used by** | `src/theory/theoryStore.js`, `src/api/engineFactory.js` (for default theories), tests for parsing |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-004 DSL requirements |
| **Implements FS** | FS-03 SpockDSL syntax and macro semantics |
| **Implements DS** | DS DSL engine and execution |

## AST Structures

### Statement AST

```javascript
{
  type: 'statement',
  declaration: string,     // e.g., "@fact1"
  subject: string,         // e.g., "a"
  verb: string,            // e.g., "In"
  object: string,          // e.g., "b"
  line: number
}
```

### Macro AST

```javascript
{
  type: 'macro',
  name: string,            // e.g., "@BasicLogic"
  declarationType: string, // 'theory' | 'verb' | 'session'
  body: Statement[],       // Array of statement ASTs
  nestedMacros: Macro[],   // Nested macro definitions
  line: number
}
```

### Script AST

```javascript
{
  type: 'script',
  statements: Statement[],
  macros: Macro[]
}
```

## Function Specifications

### `parseScript(text)`

Parses an entire DSL script into an AST.

**Parameters:**
- `text` (string): Complete DSL script text

**Returns:**
- Script AST object

**Behaviour:**
1. Tokenize the input text
2. Identify top-level statements and macro headers
3. Parse each macro with `parseMacro`
4. Build complete AST

**Error Handling:**
- Reports malformed headers with line numbers
- Reports missing `begin` or `end` keywords
- Reports duplicate `@name` declarations (SSA violation)

### `parseMacro(tokens, startIndex)`

Parses a single macro definition from a token stream.

**Parameters:**
- `tokens` (Token[]): Array of tokens
- `startIndex` (number): Index of macro header token

**Returns:**
- Macro AST object

**Behaviour:**
1. Parse header: `@MacroName declarationType begin`
2. Collect body statements until `end`
3. Handle nested macro definitions recursively
4. Validate SSA rule within the macro

## Validation Rules

| Rule | Error Message |
|------|---------------|
| Missing `begin` | "Expected 'begin' at line X" |
| Missing `end` | "Unclosed macro starting at line X" |
| Invalid declarationType | "Invalid declarationType 'Y' at line X, expected theory/verb/session" |
| Duplicate declaration | "Duplicate declaration '@name' at line X (first declared at line Y)" |
| Malformed statement | "Expected '@varName subject verb object' at line X" |

## Parsing Examples

### Valid Theory

```spockdsl
@BasicLogic theory begin
    @fact1 a In b
    @fact2 b In c
end
```

Parses to:
```javascript
{
  type: 'macro',
  name: '@BasicLogic',
  declarationType: 'theory',
  body: [
    { type: 'statement', declaration: '@fact1', subject: 'a', verb: 'In', object: 'b', line: 2 },
    { type: 'statement', declaration: '@fact2', subject: 'b', verb: 'In', object: 'c', line: 3 }
  ],
  nestedMacros: [],
  line: 1
}
```

### Error Example

```spockdsl
@BadMacro theory
    @fact1 a In b
end
```

Error: "Expected 'begin' at line 1"
