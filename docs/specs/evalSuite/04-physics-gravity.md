# DS evalSuite/04-physics-gravity/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 04-physics-gravity |
| **Goal** | Test simple physical reasoning using mass and gravity, verifying that numeric and conceptual layers work together. |
| **Theory focus** | A `GravityTheory` that defines `ComputeWeight` using `MulNumeric` and units like N (Newton). |
| **Engine aspects** | Verb macros over numeric values, attaching measured values to concepts. |

## Example Task

| Field | Value |
|-------|-------|
| **NL_TASK** | Given a mass of 10 kg and gravitational acceleration of 9.8 m_per_s2, compute the weight force in Newtons. |
| **TASK_TYPE** | Explain |

### DSL_TASK

```spockdsl
@GravitySession session begin
    @useGravity local UseTheory GravityTheory

    @massLiteral 10 HasNumericValue 10
    @mass massLiteral AttachUnit kg

    @gLiteral 9.8 HasNumericValue 9.8
    @g gLiteral AttachUnit m_per_s2

    @force mass ComputeForce g
end
```

### DSL_OUTPUT

```spockdsl
@GravityResult session begin
    @useGravity local UseTheory GravityTheory

    @forceLiteral 98 HasNumericValue 98
    @forceRaw forceLiteral AttachUnit N
    @force forceRaw AttachToConcept Force
end
```

### NL_OUTPUT

The system computes a force of 98 N attached to the concept Force and can explain it as mass times acceleration.

## Tasks Summary

10 tasks testing gravitational calculations, unit conversions, and physical reasoning.
