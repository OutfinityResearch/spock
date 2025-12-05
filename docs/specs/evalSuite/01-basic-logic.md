# DS evalSuite/01-basic-logic/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 01-basic-logic |
| **Goal** | Test the most basic logical operations: asserting facts, combining them with `And`, and checking implication with `Implies` and `Evaluate`. |
| **Theory focus** | Core `BasicLogic` theory with minimal concepts (Human, Mortal) and verbs (Is, And, Implies, Evaluate). |
| **Engine aspects** | Parsing, execution in a simple session, name resolution, truth degree computation, DSL trace production. |

## Geometric Truth Model

This suite validates the **geometric truth model** where:
- `Truth` is a canonical random unit vector (generated at engine startup)
- Truth degrees are vectors aligned with `Truth` but of varying magnitude
- `0.8 * Truth` represents "80% true"
- `False = -Truth` (opposite direction)
- Logical results are composable vectors, not discrete booleans

## theory.spockdsl

```spockdsl
@BasicLogic theory begin
    # Note: Truth, False, Zero are canonical constants provided by the engine

    # Is: Creates a fact by binding subject to object role
    # Returns a composite vector representing "subject is object"
    @Is verb begin
        @binding $subject Bind $object
        @result $binding Move $subject
    end

    # And: Combines two facts/truth vectors via addition
    # Evidence accumulation: two partial truths can sum to stronger truth
    @And verb begin
        @combined $subject Add $object
        @result $combined Normalise $combined
    end

    # Or: Logical disjunction via max-like combination
    # Takes the "more true" of two options
    @Or verb begin
        @combined $subject Add $object
        @result $combined Identity $combined
    end

    # Implies: Measures how well antecedent supports consequent
    # Returns a truth vector (similarity * Truth)
    @Implies verb begin
        # Compute similarity between antecedent and consequent
        # Distance returns a scalar (cosine similarity) in [0, 1]
        @similarity $subject Distance $object

        # Convert scalar to truth vector by scaling Truth
        # Modulate(Truth, 0.8) -> 0.8 * Truth
        @result Truth Modulate $similarity
    end

    # Evaluate: Converts a scalar truth degree to a truth vector
    # Signature: scalar Evaluate Truth -> scalar * Truth
    @Evaluate verb begin
        @scalarInput $subject
        @targetConcept $object

        # Modulate is polymorphic: vector * scalar -> scaled vector
        @result $targetConcept Modulate $scalarInput
    end

    # Negate: Logical negation (flip truth direction)
    @Not verb begin
        @result $subject Negate $subject
    end
end
```

### Design Notes

1. **Magic Variables**: `$subject` and `$object` are the verb's inputs
2. **Modulate Polymorphism**: `Modulate(vector, scalar)` performs scalar multiplication
3. **Truth as Direction**: All logical operations produce vectors aligned (or anti-aligned) with `Truth`
4. **Composability**: `And` uses `Add` so evidence accumulates: `0.3*Truth + 0.4*Truth = 0.7*Truth`

## Example Task 1

| Field | Value |
|-------|-------|
| **NL_TASK** | Check that from "All humans are mortal" and "Socrates is human", the system can derive "Socrates is mortal" and evaluate it as true. |
| **TASK_TYPE** | Ask |

### DSL_TASK

```spockdsl
@BasicLogicSession session begin
    @useLogic _ UseTheory BasicLogic

    # Establish facts as hypervectors
    @p1 Humans Is Mortal
    @p2 Socrates Is Human

    # Combine premises (evidence accumulation)
    @premise p2 And p1

    # State the conclusion we want to verify
    @conclusion Socrates Is Mortal

    # Check if premises imply conclusion
    # Returns a truth vector (similarity * Truth)
    @implicationResult premise Implies conclusion
end
```

### DSL_OUTPUT

```spockdsl
@BasicLogicResult session begin
    @useLogic _ UseTheory BasicLogic

    @p1 Humans Is Mortal
    @p2 Socrates Is Human
    @premise p2 And p1
    @conclusion Socrates Is Mortal

    # The implication result is a vector close to Truth
    # (high similarity between premise structure and conclusion)
    @implicationResult premise Implies conclusion

    # Truth alignment check: implicationResult · Truth ≈ 0.85
    # This means the implication holds with ~85% confidence
    @truthScore implicationResult Distance Truth
end
```

### NL_OUTPUT

After loading the logic theory and the given facts, the implication "premises → Socrates Is Mortal" produces a truth vector aligned ~85% with the canonical Truth direction. This indicates the reasoning chain is geometrically coherent.

## Additional Tasks (2-10)

The suite contains 10 total tasks testing:
- Simple fact assertion
- Conjunction (And)
- Implication (Implies)
- Evaluation (Evaluate)
- Negation
- Chained implications
- Contradictions
- Multiple premises
- Complex queries
- Truth degree boundaries
