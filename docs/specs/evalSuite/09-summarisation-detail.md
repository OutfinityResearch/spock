# DS evalSuite/09-summarisation-detail/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 09-summarisation-detail |
| **Goal** | Test summarisation of multiple facts into a prototype and expansion of a concept into more detailed descriptions. |
| **Theory focus** | A `SummaryTheory` with `Summarise` and `Detail` verbs. |
| **Engine aspects** | Prototype computation, projection back into descriptive facts. |

## Example Task

| Field | Value |
|-------|-------|
| **NL_TASK** | Summarise several facts about "Socrates" (Human, Philosopher, Greek) into a single summarised concept and then request more detail about it. |
| **TASK_TYPE** | Summarise |

### DSL_OUTPUT (excerpt)

```spockdsl
@SummaryResult session begin
    @summaryConcept Socrates Is SummarisedConcept

    @d1 Socrates Is Human
    @d2 Socrates Is Philosopher
    @d3 Socrates Is Greek
end
```

### NL_OUTPUT

The system creates a summarised concept for Socrates and, when asked for details, reproduces representative facts like "Socrates Is Human" and "Socrates Is Philosopher".

## Tasks Summary

10 tasks testing summarisation and detail expansion.
