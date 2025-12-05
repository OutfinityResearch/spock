# DS evalSuite/03-numeric-quantities/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 03-numeric-quantities |
| **Goal** | Test numeric handling: measured values, units, numeric arithmetic verbs. |
| **Theory focus** | A `NumericExamples` theory using `HasNumericValue`, `AttachUnit`, `AddNumeric`, `DivNumeric`, `AttachToConcept`. |
| **Engine aspects** | Numeric kernel, unit compatibility, integration with conceptual layer. |

## theory.spockdsl

```spockdsl
@NumericExamples theory begin
    # Numeric verbs are kernel-level, theory provides patterns

    @ComputeSpeed verb begin
        @dist subject
        @time object
        @speedRaw dist DivNumeric time
        @result speedRaw AttachUnit m_per_s
    end

    @ComputeTotal verb begin
        @val1 subject
        @val2 object
        @result val1 AddNumeric val2
    end
end
```

## Example Task 1

| Field | Value |
|-------|-------|
| **NL_TASK** | Represent two distances, compute their sum and derive an average speed given a time interval. |
| **TASK_TYPE** | Learn |

### DSL_TASK

```spockdsl
@NumericSession session begin
    @useNumeric local UseTheory NumericExamples

    @dist1Literal 5 HasNumericValue 5
    @dist1 dist1Literal AttachUnit m

    @dist2Literal 7 HasNumericValue 7
    @dist2 dist2Literal AttachUnit m

    @timeLiteral 5 HasNumericValue 5
    @time timeLiteral AttachUnit s

    @totalDist dist1 AddNumeric dist2
    @speedRaw totalDist DivNumeric time
    @speed speedRaw AttachUnit m_per_s
end
```

### DSL_OUTPUT

```spockdsl
@NumericResult session begin
    @useNumeric local UseTheory NumericExamples

    @totalDistLiteral 12 HasNumericValue 12
    @totalDist totalDistLiteral AttachUnit m

    @speedLiteral 2.4 HasNumericValue 2.4
    @speed speedLiteral AttachUnit m_per_s
end
```

### NL_OUTPUT

The system stores a measured distance of 12 m and a speed of 2.4 m_per_s, both correctly unit-labelled and attached to the appropriate concepts.

## Additional Tasks (2-10)

Testing:
- Unit addition (same units)
- Unit incompatibility error
- Unit multiplication (force = mass × acceleration)
- Unit division (speed = distance / time)
- Unit cancellation
- Attaching to concepts
- Projecting from concepts
- Complex unit chains
- Floating point precision
- Edge cases (zero, negative)
