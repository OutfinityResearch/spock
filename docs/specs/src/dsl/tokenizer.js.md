# DS src/dsl/tokenizer.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Split raw DSL text into tokens, remove comments and provide line information for error reporting. |
| **Public functions** | `tokenizeLine(line)`, `tokenizeScript(text)` |
| **Depends on** | None |
| **Used by** | `src/dsl/parser.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-004 DSL requirements |
| **Implements FS** | FS-03 SpockDSL syntax and macro semantics |
| **Implements DS** | DS DSL engine and execution |

## Token Structure

```javascript
{
  value: string,      // The token text
  line: number,       // Line number (1-indexed)
  column: number,     // Column position (1-indexed)
  type: string        // 'declaration' | 'identifier' | 'keyword' | 'literal'
}
```

## Function Specifications

### `tokenizeLine(line)`

Tokenizes a single line of DSL text.

**Parameters:**
- `line` (string): A single line of DSL code

**Returns:**
- Array of token objects for that line

**Behaviour:**
1. Strip comments (everything from `#` to end of line)
2. Split on whitespace
3. Classify each token by type
4. Record column positions

**Examples:**
```javascript
tokenizeLine("@fact1 a In b")
// Returns: [
//   { value: "@fact1", type: "declaration", line: 1, column: 1 },
//   { value: "a", type: "identifier", line: 1, column: 8 },
//   { value: "In", type: "identifier", line: 1, column: 10 },
//   { value: "b", type: "identifier", line: 1, column: 13 }
// ]

tokenizeLine("@useLogic local UseTheory BasicLogic  # comment")
// Returns tokens without the comment
```

### `tokenizeScript(text)`

Tokenizes an entire DSL script.

**Parameters:**
- `text` (string): Complete DSL script text

**Returns:**
- Array of token objects with line numbers

**Behaviour:**
1. Split text into lines
2. Process each line with `tokenizeLine`
3. Assign correct line numbers
4. Skip empty lines but preserve line numbering
5. Handle multi-line macro bodies

**Constraints:**
- Line numbers are 1-indexed for user-friendly error messages
- Empty lines produce no tokens but don't affect line numbering
- Comments are stripped before tokenization

## Token Types

| Type | Pattern | Examples |
|------|---------|----------|
| `declaration` | Starts with `@` | `@fact1`, `@result`, `@BasicLogic` |
| `keyword` | Reserved words | `begin`, `end`, `theory`, `verb`, `session` |
| `identifier` | Alphanumeric | `Socrates`, `Is`, `Human`, `UseTheory` |
| `literal` | Numeric | `5`, `3.14`, `-10` |

## Comment Handling

- Comments start with `#` and extend to end of line
- Inline comments are supported: `@fact1 a Is b # this is a comment`
- Comments are completely stripped before parsing
