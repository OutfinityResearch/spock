# FS – Functional Specification

## FS-01 Core Conceptual Model

This section defines the main runtime entities and their roles.

| Entity | Description |
|--------|-------------|
| `@name` declaration | Any identifier prefixed with `@` declares a new variable in the current scope and is bound to a **typed runtime value** (see Runtime Type System below). It always represents a point in space that can be temporary or later saved into a theory by `Remember`. |
| Reference name | Refers to a previously declared `@name` in the visible context. It is used as subject, verb or object in statements. |
| Fact | Result of a statement `@varName subject verb object`. The value bound to `@varName` is a fact or state that can be reused. |
| Concept | A fact that is interpreted as a stable prototype in the conceptual space and may accumulate statistics. |
| Theory | A macro of type `theory` that groups definitions, facts and verbs and can be persisted. |
| Verb | A macro of type `verb` that defines a homotopic binary relation using `$subject` and `$object` and produces `@result`. |
| Session | A macro of type `session` used as a working context that overlays theories and hosts temporary facts. |

### Runtime Type System

Variables (`@name`) in SpockDSL are **boxed values** with explicit type tags. This enables polymorphic operations and proper handling of scalars from operations like `Distance`.

| Type | Internal Representation | Description |
|------|------------------------|-------------|
| `VECTOR` | `{ type: 'VECTOR', value: Float32Array }` | Hypervector in conceptual space |
| `SCALAR` | `{ type: 'SCALAR', value: number }` | Single numeric value (e.g., from `Distance`) |
| `NUMERIC` | `{ type: 'NUMERIC', value: number, unit: string }` | Measured value with unit |
| `MACRO` | `{ type: 'MACRO', ast: MacroAST }` | Verb or theory definition |

**Type Checking Rules:**
- `Distance(v1, v2)` → returns `SCALAR`
- `Modulate(VECTOR, SCALAR)` → returns `VECTOR` (scalar multiplication)
- `Modulate(VECTOR, VECTOR)` → returns `VECTOR` (Hadamard product)
- `Add(VECTOR, VECTOR)` → returns `VECTOR`
- `Add(SCALAR, SCALAR)` → returns `SCALAR`
- Type mismatches produce runtime errors with clear messages

### Canonical Constants

The system provides built-in canonical constants available in every session:

| Constant | Description |
|----------|-------------|
| `Truth` | A random fixed hypervector of norm 1, generated at engine initialization. Represents the canonical direction of "true" in conceptual space. |
| `False` | Defined as `Negate(Truth)`. Represents the opposite direction of truth. |
| `Zero` | The zero vector (all components 0). Represents absence of information or neutral state. |

**Design Rationale:** Truth is a dense random vector (Gaussian or bipolar ±1) rather than a one-hot vector like `[1,0,0,...]`. In high-dimensional spaces, random vectors are quasi-orthogonal to each other with high probability, making them robust to noise and rotations. This is standard practice in Vector Symbolic Architectures (VSA).

**Truth Geometry:**
- Full truth: vector aligned with `Truth` (magnitude ≈ 1)
- Partial truth: vector aligned with `Truth` but shorter (e.g., `0.8 * Truth` = 80% true)
- Falsity: vector aligned with `-Truth`
- Uncertainty: vector orthogonal to `Truth` or zero vector

### Magic Variables Inside Verbs

| Variable | Role |
|----------|------|
| `$subject` | Input hypervector used as the subject of the verb. |
| `$object` | Input hypervector used as the object of the verb. |
| `@result` | Special declaration inside verb macros that denotes the final output. It must be declared exactly once. |

### Concept Auto-Generation

When a DSL statement references an undefined identifier (e.g., `Socrates`, `Human`, `Mortal`), the system automatically generates a new concept:

| Situation | Behavior |
|-----------|----------|
| First use of identifier | Generate random hypervector via `createRandomVector(dim)`, register in session/theory |
| Subsequent uses | Resolve to previously generated vector |
| Persistence | Session-local concepts are lost at session end; use `Remember` to persist |

**Example:**
```spockdsl
@fact Socrates Is Human
# If Socrates, Is, Human are undefined:
# - Socrates → new random vector
# - Is → verb lookup (defined in theory)
# - Human → new random vector
# - @fact → result of Is(Socrates, Human)
```

**Design Rationale:** Auto-generation enables rapid prototyping without explicit concept declarations. In high-dimensional spaces, random vectors are quasi-orthogonal, so auto-generated concepts are naturally distinct.

## FS-02 Verb Taxonomy and Constraints

Verbs are grouped by role but all obey the same binary, homotopic structure.

| Category | Examples | Notes |
|----------|----------|-------|
| Kernel verbs | `Add`, `Bind`, `Negate`, `Distance`, `Move`, `Modulate`, `Identity`, `Normalise` | Map directly to vector operations. |
| Logical / causal | `Implies`, `Causes`, `And`, `Or`, `EquivalentTo`, `Evaluate` | Defined as macros in a basic logic theory. |
| Planning / solving | `Plan`, `Solve` | Use Semantic Gradient Descent algorithm (see below). |
| Domain-specific | `Eat`, `Learn`, `Prove`, `Explain`, `Summarise`, `Detail` | Implement domain logic over kernel and logical verbs. |
| Theory management | `UseTheory`, `Remember`, `BranchTheory`, `MergeTheory`, `EvaluateTheory`, `CompareTheories` | Manage theories, sessions and versions. |
| Numeric | `HasNumericValue`, `AttachUnit`, `AddNumeric`, `SubNumeric`, `MulNumeric`, `DivNumeric`, `AttachToConcept`, `ProjectNumeric` | Work with numeric values and units. |

### Verb Constraints

| Constraint | Description |
|------------|-------------|
| Binary inputs | Verbs accept only `$subject` and `$object` as semantic inputs. |
| Composite structure | Composite verbs are defined only via DSL statements in their body, eventually calling other verbs but not arbitrary extra parameters. |
| Homotopy | Verb implementations must correspond to continuous transformations in vector space, enabling reversible or smoothly reversible reasoning where possible. |
| Runtime type dispatch | Polymorphic verbs (e.g., `Modulate`, `Add`) check the runtime type of their arguments to determine behavior. Type: `VECTOR` vs `SCALAR` determines the operation applied. |

### Key Verb Semantics

#### Evaluate (Truth Projection)

The `Evaluate` verb transforms a scalar truth degree into a geometric truth vector by modulating the canonical `Truth` constant:

```
scalar Evaluate Truth → scalar * Truth (vector)
```

This enables:
- **Composability**: Truth vectors can be combined with `Add` (evidence accumulation)
- **Continuity**: All logical operations produce vectors, not discrete values
- **Explainability**: Results can be described as "X% aligned with Truth"

#### Modulate (Polymorphic Scaling)

`Modulate` is polymorphic based on the second operand:
- `Modulate(vector, vector)` → element-wise product (Hadamard) or convolution (gating)
- `Modulate(vector, scalar)` → scalar multiplication (scaling)

This dual behavior allows `Evaluate` to scale `Truth` by a similarity score.

#### Identity (Pass-through)

`Identity` returns its subject unchanged. Used when DSL syntax requires a verb but no transformation is needed.

#### Plan and Solve (Semantic Gradient Descent)

The `Plan` and `Solve` verbs use a **Semantic Gradient Descent** algorithm - a geometric approach to search that navigates the conceptual space toward a goal.

**Algorithm:**
```
Plan(currentState, goalState):
    while Distance(current, goal) > epsilon:
        candidates = []
        for each available verb V in context:
            for each applicable object O:
                nextState = V(current, O)
                score = Distance(nextState, goal)  # cosine similarity
                candidates.append((V, O, nextState, score))

        best = argmin(candidates, by=score)
        if best.score >= Distance(current, goal):
            # Plateau detected - no progress
            return FAILURE or invoke procedural fallback

        plan.append(best.action)
        current = best.nextState

    return plan
```

**Key Properties:**
- **Geometric navigation**: Chooses actions that minimize angular distance (maximize cosine similarity) to goal
- **Greedy hill-climbing**: Always picks the locally best action
- **Plateau detection**: If no action improves the score, either fail or invoke procedural plugin
- **Composability**: Plan steps are DSL statements that can be traced and explained

**Fallback Mechanism:**
If pure geometric navigation fails (plateau or cycle), the system can invoke a procedural solver plugin (JavaScript). This hybrid approach maintains geometric priority while ensuring completeness for constraint problems.

**Solve vs Plan:**
- `Plan`: Finds a sequence of actions (trajectory through space)
- `Solve`: Finds an assignment satisfying constraints (point in space)

## FS-03 SpockDSL Syntax and Macro Semantics

This section fixes the syntax and evaluation rules for SpockDSL.

| Element | Definition |
|---------|------------|
| Statement | `@varName subject verb object` (exactly 4 tokens). `@varName` declares a new symbol; the other tokens reference literals or existing names. |
| Macro header | `@MacroName declarationType begin` where `declarationType ∈ {theory, verb, session}`. |
| Macro body | Sequence of statements and nested macro definitions ending at `end`. |
| SSA rule | Inside a single macro each `@name` appears only once as a declaration. |
| Dependency graph | Nodes are statements; edges connect a statement to the statements that define the names it uses. |
| Topological evaluation | The interpreter executes statements in an order that respects the dependency graph. |
| Comments/blank lines | Lines starting with `#` or empty/whitespace-only lines are ignored anywhere. |
| Operand naming | Only the first token may start with `@`. Operands/verbs use plain names. To reference a prior declaration explicitly, prefix it with `$name`; otherwise the operand is treated as a concept/fact from the current or overlaid theories. |
| Garbage collection | Only declarations explicitly persisted (see FS-06) or returned as result are expected to remain after execution. |

### Example: Simple Theory

```spockdsl
@BasicLogic theory begin
    @fact1 a In b
    @fact2 b In c
    @premise fact1 And fact2
    @conclusion a In c
    @rule premise Implies conclusion
end
```

### Example: Composite Verb

```spockdsl
@Eat verb begin
    @subjectRole $subject Bind Calories
    @interaction subjectRole Add $object
    @result interaction Move $subject
end
```

**Note:** Inside verb macros, `$subject` and `$object` are magic variables that refer to the verb's inputs.

### Example: Session

```spockdsl
@ReasoningSession session begin
    @useLogic _ UseTheory BasicLogic
    @s1 Socrates Is Human
    @s2 Humans Are Mortal
    @query s1 Implies s2
end
```

**Note:** The `_` in `@useLogic _ UseTheory BasicLogic` is a placeholder subject (the theory is loaded as a side effect). Alternative syntax: `@_ BasicLogic UseTheory _` where `UseTheory` is a special verb.

## FS-04 Theories, Sessions, Overlays and Versions

This section describes how theories, sessions and versioning work at the functional level.

| Concept | Description |
|---------|-------------|
| Theory | A named macro of type `theory` whose body contains facts and verb definitions. |
| Session | A macro of type `session` that defines a temporary namespace for `@` declarations and overlays theories. |
| Overlay | Achieved by `UseTheory`, which makes a theory visible in the current session without copying its content. |
| Branching | `BranchTheory` creates a new in-memory theory that initially copies a base theory and records a parent version. |
| Merging | `MergeTheory` combines two in-memory theories and produces a merged version. |
| Persistence | `Remember` writes selected facts or definitions from a session or branched theory to a named persistent theory on disk; `Persist` pins a value in the current session so it survives GC and is emitted in `DSL_OUTPUT`. |

### Example: Versioned Session

```spockdsl
@VersionedSession session begin
    @useClassic _ UseTheory ClassicalPhysics_v1
    @useQuantum _ UseTheory QuantumPhysics_v3

    @regime data EvaluateTheory ClassicalPhysics_v1
    @regime2 data EvaluateTheory QuantumPhysics_v3
    @decision regime CompareTheories regime2
end
```

## FS-05 Numeric Data Types and Units

SpockDSL supports explicit numeric values and units while staying compatible with the core DSL shape.

| Type | Description |
|------|-------------|
| `NUMERIC_SCALAR` | Floating-point number stored internally, e.g. Float64. |
| `NUMERIC_VECTOR` | Tuple of scalars (e.g. position vector). |
| `UNIT` | Symbol describing a measurement unit (e.g. kg, m, s, m_per_s). |
| `MEASURED_VALUE` | Structure combining numeric value, unit and optional link to a concept. |

### Numeric DSL Conventions

```spockdsl
@massLiteral 80 HasNumericValue 80
@mass massLiteral AttachUnit kg

@timeLiteral 5 HasNumericValue 5
@time timeLiteral AttachUnit s

@dist1Literal 5 HasNumericValue 5
@dist1 dist1Literal AttachUnit m

@dist2Literal 7 HasNumericValue 7
@dist2 dist2Literal AttachUnit m

@distTotal dist1 AddNumeric dist2
@speedRaw distTotal DivNumeric time
@speed speedRaw AttachUnit m_per_s
```

### Lift Between Numeric and Geometric

```spockdsl
@stone Stone Is Concept

@massLiteral 2.5 HasNumericValue 2.5
@mass massLiteral AttachUnit kg

@stoneMass mass AttachToConcept stone
@avgMass stone ProjectNumeric Mass
```

## FS-06 Public API

The public interface exposes a reasoning engine and sessions. All interactions are expressed in terms of DSL scripts and DSL-explainable outputs.

| Element | Description |
|---------|-------------|
| Engine factory | `createSpockEngine(options)` creates an engine instance with a working folder (default `.spock`). |
| Session | `engine.createSession()` returns a `SpockSession`. |
| Session methods | `learn`, `ask`, `prove`, `explain`, `plan`, `solve`, `summarise`. Each method accepts a DSL script and returns symbols, scores and a DSL trace. |

Each method must:
- Execute the given DSL script according to the rules defined above.
- Return a machine-readable result (symbols, numeric scores) and a DSL representation of the outcome that can be replayed.

## FS-07 Explainable Outputs and Evaluation Format

All outputs are explainable and testable via the evaluation suite.

| Aspect | Description |
|--------|-------------|
| DSL output | For any script executed by `learn`, `ask`, `prove`, `explain`, `plan`, `solve`, `summarise`, the system can generate a `DSL_OUTPUT` script that reproduces the resulting state when re-executed. |
| Natural language output | Optionally, the engine or an external LLM can produce `NL_OUTPUT`, a natural language description aligned with `DSL_OUTPUT`. |
| Determinism | Given the same initial theories, session and script, the system produces the same `DSL_OUTPUT` and scores. |

---

## Cross-Reference: FS to URS/NFS

| FS ID | Related URS | Related NFS |
|-------|-------------|-------------|
| FS-01 | URS-001, URS-003, URS-006 | NFS-01 |
| FS-02 | URS-001, URS-003 | NFS-01 |
| FS-03 | URS-004 | NFS-02 |
| FS-04 | URS-005 | NFS-02 |
| FS-05 | URS-003 | NFS-01 |
| FS-06 | URS-002, URS-007 | NFS-03 |
| FS-07 | URS-008 | NFS-03 |
