# DS tests/dsl/tokenizer.test.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Unit tests for DSL tokenisation in `src/dsl/tokenizer.js`. |
| **Test style** | Pure unit tests. |
| **Functions under test** | `tokenizeLine`, `tokenizeScript`. |

## Test Cases

### tokenizeLine

| Test | Input | Expected |
|------|-------|----------|
| Basic statement | `"@fact1 a In b"` | 4 tokens |
| With comment | `"@fact1 a In b # comment"` | 4 tokens (comment stripped) |
| Empty line | `""` | 0 tokens |
| Whitespace only | `"   "` | 0 tokens |
| Declaration token | `"@fact1 ..."` | First token type is 'declaration' |
| Numeric literal | `"@x 5 HasValue 5"` | Includes literal token |

### tokenizeScript

| Test | Input | Expected |
|------|-------|----------|
| Multi-line script | `"@f1 a Is b\n@f2 c Is d"` | Tokens with correct line numbers |
| Empty lines preserved | `"@f1 a Is b\n\n@f2 c Is d"` | Line numbers: 1, 3 |
| Comment-only lines | `"# comment\n@f1 a Is b"` | Line 2 has first token |
| Macro header | `"@Logic theory begin"` | 3 tokens |

## Token Type Classification

| Input | Expected Type |
|-------|---------------|
| `@fact1` | `declaration` |
| `theory` | `keyword` |
| `begin` | `keyword` |
| `end` | `keyword` |
| `Socrates` | `identifier` |
| `5` | `literal` |
| `3.14` | `literal` |

## Edge Cases

| Test | Input | Behaviour |
|------|-------|-----------|
| Unicode | `"@fait1 α Est β"` | Handled correctly |
| Special chars | `"@fact1 a_b Is c-d"` | Valid identifiers |
| Tab characters | `"@f1\ta\tIs\tb"` | Split correctly |
| Multiple spaces | `"@f1   a   Is   b"` | Single tokens |

## Error Handling

- Malformed input should not crash
- Invalid tokens should be reported with position
- Unclosed strings (if supported) should error
