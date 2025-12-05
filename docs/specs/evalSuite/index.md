# DS evalSuite/

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Root folder for all deterministic evaluation suites of the Spock engine. |
| **Content** | One subfolder per evaluation case (suite), plus optional shared README / templates. |
| **Behaviour** | The evaluation runner (`src/eval/evalRunner.js`) discovers available suites by scanning subfolders of `evalSuite/`. |
| **Determinism** | All suites must be constructed so that, given the same engine version and configuration, results are fully deterministic: same truth scores, same internal step counts and same pass/fail outcomes. |
| **LLM usage** | No LLMs are used during evalSuite runs; only SpockDSL scripts and the engine itself. |

## Suite Structure

```
evalSuite/
├── index.md                    # This file
├── 01-basic-logic/
│   ├── theory.spockdsl
│   └── tasks.json
├── 02-transitivity-syllogism/
│   ├── theory.spockdsl
│   └── tasks.json
├── ...
└── 10-mixed-reasoning/
    ├── theory.spockdsl
    └── tasks.json
```

## Suite Requirements

Each suite subfolder must contain:
- `theory.spockdsl` - Theory definitions for the suite
- `tasks.json` - Exactly 10 task records

## Task Record Schema

```json
{
  "NL_TASK": "Human-readable description of the task",
  "TASK_TYPE": "Learn|Ask|Proof|Explain|Plan|Solve|Summarise",
  "DSL_TASK": "SpockDSL script to execute",
  "DSL_OUTPUT": "Expected DSL output",
  "NL_OUTPUT": "Natural language description of expected result"
}
```

## Available Suites

| Suite | Goal |
|-------|------|
| [01-basic-logic](01-basic-logic.md) | Test basic logical operations |
| [02-transitivity-syllogism](02-transitivity-syllogism.md) | Test transitivity and syllogisms |
| [03-numeric-quantities](03-numeric-quantities.md) | Test numeric handling and units |
| [04-physics-gravity](04-physics-gravity.md) | Test physical reasoning |
| [05-planning-linear](05-planning-linear.md) | Test linear planning |
| [06-explanation-causality](06-explanation-causality.md) | Test causal chains |
| [07-puzzle-solving](07-puzzle-solving.md) | Test constraint-based reasoning |
| [08-theory-versioning](08-theory-versioning.md) | Test theory branching/merging |
| [09-summarisation-detail](09-summarisation-detail.md) | Test summarisation |
| [10-mixed-reasoning](10-mixed-reasoning.md) | Test mixed scenarios |

## Execution Semantics

1. **Engine initialisation**: Fresh engine per suite
2. **Theory loading**: Load default theories, then suite theory
3. **Task execution**: Execute each task via appropriate API method
4. **Comparison**: Compare output with DSL_OUTPUT
5. **Reporting**: Pass/fail per task, step counts
