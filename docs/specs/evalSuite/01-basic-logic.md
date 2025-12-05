# DS evalSuite/01-basic-logic/

## Overview

| Field | Value |
|-------|-------|
| **Case id** | 01-basic-logic |
| **Goal** | Test the most basic logical operations: asserting facts, combining them with `And`, and checking implication with `Implies` and `Evaluate`. |
| **Theory focus** | Core `BasicLogic` theory with minimal concepts (Human, Mortal) and verbs (Is, And, Implies, Evaluate). |
| **Engine aspects** | Parsing, execution in a simple session, name resolution, truth degree computation, DSL trace production. |

## theory.spockdsl

```spockdsl
@BasicLogic theory begin
    @Is verb begin
        @binding subject Bind object
        @result binding Move subject
    end

    @And verb begin
        @combined subject Add object
        @result combined Normalise combined
    end

    @Implies verb begin
        @antecedent subject
        @consequent object
        @implication antecedent Distance consequent
        @result implication Evaluate Truth
    end

    @Evaluate verb begin
        @input subject
        @threshold object
        @score input Distance threshold
        @result score Move input
    end
end
```

## Example Task 1

| Field | Value |
|-------|-------|
| **NL_TASK** | Check that from "All humans are mortal" and "Socrates is human", the system can derive "Socrates is mortal" and evaluate it as true. |
| **TASK_TYPE** | Ask |

### DSL_TASK

```spockdsl
@BasicLogicSession session begin
    @useLogic local UseTheory BasicLogic

    @p1 Humans Are Mortal
    @p2 Socrates Is Human
    @premise p2 And p1
    @conclusion Socrates Is Mortal
    @rule premise Implies conclusion

    @query conclusion Evaluate Truth
end
```

### DSL_OUTPUT

```spockdsl
@BasicLogicResult session begin
    @useLogic local UseTheory BasicLogic

    @p1 Humans Are Mortal
    @p2 Socrates Is Human
    @premise p2 And p1
    @conclusion Socrates Is Mortal
    @rule premise Implies conclusion

    @query conclusion Evaluate Truth
    @passed query Is TrueLike
end
```

### NL_OUTPUT

After loading the logic theory and the given facts, the query "Socrates Is Mortal" is evaluated with truth close to 1.0 and is considered true.

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
