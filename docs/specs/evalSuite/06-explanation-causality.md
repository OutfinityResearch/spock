# DS evalSuite/06-explanation-causality/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 06-explanation-causality |
| **Goal** | Test causal chains and abductive explanation: find likely causes for an observed effect. |
| **Theory focus** | A `CausalityTheory` with verbs `Causes` and `Explain`. |
| **Engine aspects** | Backward reasoning over causal links, evaluation of candidate explanations. |

## Example Task

| Field | Value |
|-------|-------|
| **NL_TASK** | Given that "Rain Causes WetStreet" and "Sprinkler Causes WetStreet", and observing "WetStreet", propose candidate causes and mark the best explanation. |
| **TASK_TYPE** | Explain |

### DSL_OUTPUT (excerpt)

```spockdsl
@CausalityResult session begin
    @candidate1 Rain Causes WetStreet
    @candidate2 Sprinkler Causes WetStreet

    @bestExplanation candidate1 Or candidate2
end
```

### NL_OUTPUT

The system identifies at least two candidate explanations (Rain, Sprinkler) and marks one or both as plausible causes of a wet street.

## Tasks Summary

10 tasks testing causal reasoning and abductive explanation.
