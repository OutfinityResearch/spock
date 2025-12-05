# FS – Functional Specification

## FS-01 Core Conceptual Model

This section defines the main runtime entities and their roles.

| Entity | Description |
|--------|-------------|
| `@name` declaration | Any identifier prefixed with `@` declares a new variable in the current scope and is bound to a hypervector or typed value. It always represents a point in space that can be temporary or later saved into a theory by `Remember`. |
| Reference name | Refers to a previously declared `@name` in the visible context. It is used as subject, verb or object in statements. |
| Fact | Result of a statement `@varName subject verb object`. The hypervector bound to `@varName` is a fact or state that can be reused. |
| Concept | A fact that is interpreted as a stable prototype in the conceptual space and may accumulate statistics. |
| Theory | A macro of type `theory` that groups definitions, facts and verbs and can be persisted. |
| Verb | A macro of type `verb` that defines a homotopic binary relation using `$subject` and `$object` and produces `@result`. |
| Session | A macro of type `session` used as a working context that overlays theories and hosts temporary facts. |

### Magic Variables Inside Verbs

| Variable | Role |
|----------|------|
| `$subject` | Input hypervector used as the subject of the verb. |
| `$object` | Input hypervector used as the object of the verb. |
| `@result` | Special declaration inside verb macros that denotes the final output. It must be declared exactly once. |

## FS-02 Verb Taxonomy and Constraints

Verbs are grouped by role but all obey the same binary, homotopic structure.

| Category | Examples | Notes |
|----------|----------|-------|
| Kernel verbs | `Add`, `Bind`, `Negate`, `Distance`, `Move`, `Modulate` | Map directly to vector operations. |
| Logical / causal | `Implies`, `Causes`, `And`, `Or`, `EquivalentTo`, `Evaluate` | Defined as macros in a basic logic theory. |
| Domain-specific | `Eat`, `Learn`, `Plan`, `Prove`, `Explain`, `Summarise`, `Detail`, `Solve` | Implement domain logic over kernel and logical verbs. |
| Theory management | `UseTheory`, `Remember`, `BranchTheory`, `MergeTheory`, `EvaluateTheory`, `CompareTheories` | Manage theories, sessions and versions. |
| Numeric | `HasNumericValue`, `AttachUnit`, `AddNumeric`, `SubNumeric`, `MulNumeric`, `DivNumeric`, `AttachToConcept`, `ProjectNumeric` | Work with numeric values and units. |

### Verb Constraints

| Constraint | Description |
|------------|-------------|
| Binary inputs | Verbs accept only `$subject` and `$object` as semantic inputs. |
| Composite structure | Composite verbs are defined only via DSL statements in their body, eventually calling other verbs but not arbitrary extra parameters. |
| Homotopy | Verb implementations must correspond to continuous transformations in vector space, enabling reversible or smoothly reversible reasoning where possible. |

## FS-03 SpockDSL Syntax and Macro Semantics

This section fixes the syntax and evaluation rules for SpockDSL.

| Element | Definition |
|---------|------------|
| Statement | `@varName subject verb object` where `@varName` declares a new symbol and the other three tokens reference existing symbols or literals. |
| Macro header | `@MacroName declarationType begin` where `declarationType ∈ {theory, verb, session}`. |
| Macro body | Sequence of statements and nested macro definitions ending at `end`. |
| SSA rule | Inside a single macro each `@name` appears only once as a declaration. |
| Dependency graph | Nodes are statements; edges connect a statement to the statements that define the names it uses. |
| Topological evaluation | The interpreter executes statements in an order that respects the dependency graph. |

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
    @subjectRole subject Bind Calories
    @interaction subjectRole Add object
    @result interaction Move subject
end
```

### Example: Session

```spockdsl
@ReasoningSession session begin
    @useLogic local UseTheory BasicLogic
    @s1 Socrates Is Human
    @s2 Humans Are Mortal
    @query s1 Implies s2
end
```

## FS-04 Theories, Sessions, Overlays and Versions

This section describes how theories, sessions and versioning work at the functional level.

| Concept | Description |
|---------|-------------|
| Theory | A named macro of type `theory` whose body contains facts and verb definitions. |
| Session | A macro of type `session` that defines a temporary namespace for `@` declarations and overlays theories. |
| Overlay | Achieved by `UseTheory`, which makes a theory visible in the current session without copying its content. |
| Branching | `BranchTheory` creates a new in-memory theory that initially copies a base theory and records a parent version. |
| Merging | `MergeTheory` combines two in-memory theories and produces a merged version. |
| Persistence | `Remember` writes selected facts or definitions from a session or branched theory to a named persistent theory on disk. |

### Example: Versioned Session

```spockdsl
@VersionedSession session begin
    @useClassic local UseTheory ClassicalPhysics_v1
    @useQuantum local UseTheory QuantumPhysics_v3

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
