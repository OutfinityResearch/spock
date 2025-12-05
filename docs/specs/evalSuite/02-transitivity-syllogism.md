# DS evalSuite/02-transitivity-syllogism/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 02-transitivity-syllogism |
| **Goal** | Test transitivity of a relation like `In` and classical syllogisms within a dedicated theory. |
| **Theory focus** | A `TransitivityTheory` with rules for chaining `In` relations. |
| **Engine aspects** | Multi-step reasoning, use of intermediate facts, homotopic composition of primitive verbs. |

## theory.spockdsl

```spockdsl
@TransitivityTheory theory begin
    @In verb begin
        @container object
        @element subject
        @membership element Bind container
        @result membership Move element
    end

    @TransitiveChain verb begin
        @step1 subject
        @step2 object
        @chain step1 Add step2
        @result chain Normalise chain
    end

    @Prove verb begin
        @premise subject
        @target object
        @derivation premise Distance target
        @result derivation Evaluate ProofStrength
    end
end
```

## Example Task 1

| Field | Value |
|-------|-------|
| **NL_TASK** | From "a In b" and "b In c", derive "a In c" using a transitivity rule and check that the rule fires correctly. |
| **TASK_TYPE** | Proof |

### DSL_TASK

```spockdsl
@TransitivitySession session begin
    @useTrans local UseTheory TransitivityTheory

    @fact1 a In b
    @fact2 b In c

    @proof fact1 Prove fact2
end
```

### DSL_OUTPUT

```spockdsl
@TransitivityResult session begin
    @useTrans local UseTheory TransitivityTheory

    @fact1 a In b
    @fact2 b In c
    @derived a In c

    @proofChain fact1 And fact2
    @proofRule proofChain Implies derived
end
```

### NL_OUTPUT

The system produces a fact "a In c" and a proof object that matches the transitivity rule defined in the theory.

## Additional Tasks (2-10)

The suite contains 10 total tasks testing:
- Simple transitivity (A In B, B In C → A In C)
- Longer chains (4+ steps)
- Branching paths
- Failed transitivity (missing link)
- Cyclic containment detection
- Barbara syllogism
- Celarent syllogism
- Mixed relations
- Proof trace verification
- Performance on longer chains
