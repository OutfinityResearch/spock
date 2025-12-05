# DS Evaluation Suite Map

**ID:** DS_eval_map

This document provides a quick reference to all evaluation suite specifications for Spock GOS. Each suite contains 10 deterministic tasks for testing reasoning capabilities.

## Evaluation Suites

| Suite | Spec | Goal | Primary FS |
|-------|------|------|-----------|
| 01 | [01-basic-logic.md](evalSuite/01-basic-logic.md) | Basic logical operations | FS-02, FS-03 |
| 02 | [02-transitivity-syllogism.md](evalSuite/02-transitivity-syllogism.md) | Transitivity and syllogisms | FS-02, FS-03 |
| 03 | [03-numeric-quantities.md](evalSuite/03-numeric-quantities.md) | Numeric handling with units | FS-05 |
| 04 | [04-physics-gravity.md](evalSuite/04-physics-gravity.md) | Physical reasoning | FS-05 |
| 05 | [05-planning-linear.md](evalSuite/05-planning-linear.md) | Linear planning | FS-02, FS-06 |
| 06 | [06-explanation-causality.md](evalSuite/06-explanation-causality.md) | Causal chains and abduction | FS-02, FS-07 |
| 07 | [07-puzzle-solving.md](evalSuite/07-puzzle-solving.md) | Constraint satisfaction | FS-02, FS-06 |
| 08 | [08-theory-versioning.md](evalSuite/08-theory-versioning.md) | Theory branching/merging | FS-04 |
| 09 | [09-summarisation-detail.md](evalSuite/09-summarisation-detail.md) | Summarisation and detail | FS-02, FS-06 |
| 10 | [10-mixed-reasoning.md](evalSuite/10-mixed-reasoning.md) | Mixed reasoning scenarios | FS-02, FS-05, FS-06 |

## Evaluation Suite Format

Each evaluation suite specification contains:

1. **Suite Metadata**: ID, goal, primary FS
2. **10 Tasks**: Each with input DSL, expected output, and evaluation criteria
3. **Evaluation Criteria**: How to score the results

## Coverage by FS

| FS | Covered by Suites |
|----|-------------------|
| FS-02 (Verbs) | 01, 02, 05, 06, 07, 09, 10 |
| FS-03 (Syntax) | 01, 02 |
| FS-04 (Theories) | 08 |
| FS-05 (Numeric) | 03, 04, 10 |
| FS-06 (API) | 05, 07, 09, 10 |
| FS-07 (Explainability) | 06 |

## Related

- [Design Spec Map](DS_map.md)
- [Test Suite Map](DS_tests_map.md)
- [Full Traceability Matrix](matrix.html)
