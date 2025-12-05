# DS tests/dsl/parser.test.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Unit tests for parsing logic in `src/dsl/parser.js`. |
| **Test style** | Mostly unit tests. |
| **Functions under test** | `parseScript`, `parseMacro`. |

## Test Cases

### parseScript - Valid Inputs

| Test | Input | Expected |
|------|-------|----------|
| Single statement | `"@f1 a Is b"` | AST with 1 statement |
| Multiple statements | `"@f1 a Is b\n@f2 c Is d"` | AST with 2 statements |
| Theory macro | `"@Logic theory begin\n@f1 a Is b\nend"` | AST with 1 macro |
| Nested macros | Theory with verb definition | Correct nesting |

### parseScript - Error Cases

| Test | Input | Expected Error |
|------|-------|----------------|
| Missing begin | `"@Logic theory\n@f1 a Is b\nend"` | "Expected 'begin' at line 1" |
| Missing end | `"@Logic theory begin\n@f1 a Is b"` | "Unclosed macro starting at line 1" |
| Invalid declarationType | `"@X invalid begin\nend"` | "Invalid declarationType 'invalid'" |
| Duplicate @name | `"@f1 a Is b\n@f1 c Is d"` | "Duplicate declaration '@f1'" |

### parseMacro

| Test | Input | Expected |
|------|-------|----------|
| Theory macro | `@Logic theory begin ... end` | MacroAST with type 'theory' |
| Verb macro | `@Eat verb begin ... end` | MacroAST with type 'verb' |
| Session macro | `@Session session begin ... end` | MacroAST with type 'session' |
| Empty body | `@Empty theory begin end` | MacroAST with empty body |

### AST Structure

| Test | Check |
|------|-------|
| Statement AST | Has `type`, `declaration`, `subject`, `verb`, `object`, `line` |
| Macro AST | Has `type`, `name`, `declarationType`, `body`, `nestedMacros`, `line` |
| Line numbers | Correct for each element |

## SSA Validation

| Test | Input | Expected |
|------|-------|----------|
| Valid SSA | Each @name once | No error |
| Duplicate in macro | `@a` twice in same macro | Error with both line numbers |
| Same name in different macros | OK | No error |

## Scope

- Input: tokenised scripts
- Output: AST structures or explicit errors
- Error messages must include line numbers
