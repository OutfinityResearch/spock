# URS – User Requirements Specification

## URS-001 System Purpose

Spock is a Geometric Operating System (GOS) for neuro-symbolic reasoning. It represents concepts, facts, relations and theories as points or regions in a high-dimensional conceptual space (hypervectors) and executes reasoning, planning and explanation through a formally defined DSL based on Subject–Verb–Object triplets.

The system must maintain semantic coherence: concepts that humans consider similar are geometrically close and operations over concepts are continuous transformations in this space.

| Aspect | Requirement |
|--------|-------------|
| Representation | Concepts, facts, verbs and DSL sentences are hypervectors in a geometric space. |
| Reasoning | Reasoning, planning and explanation are expressed as DSL scripts and executed as geometric transformations. |
| Continuity | Transformations should be homotopic, avoiding discontinuous, brute logical jumps. |
| Truth values | Degrees of truth are **vectors aligned with a canonical Truth direction**, not scalars or booleans. A truth degree of 0.8 is represented as `0.8 * Truth` (a vector). This enables composable, continuous reasoning. |

## URS-002 Stakeholders and Usage Context

| Stakeholder | Role |
|-------------|------|
| Author / researcher | Defines theories, verbs, concepts; experiments with geometric reasoning. |
| LLM / NLU agent | Translates natural language into DSL and back and uses the system as a reasoning engine. |
| Downstream application | Uses the engine for planning, explanation, logical games, autonomous agents, diagnostic workflows, and similar tasks. |

## URS-003 Geometric Knowledge Representation

Geometric representation is the core of Spock.

| Aspect | Requirement |
|--------|-------------|
| Concept representation | Each concept has a prototype hypervector and optional statistics (e.g. number of observations). |
| Fact representation | Each executed DSL statement produces a hypervector interpreted as a fact or state. |
| Theory representation | A theory is a set of DSL macros that define relations, rules and higher level verbs, all grounded in vector space. |
| Session representation | A session is an overlay on top of global knowledge, with local variables and facts affecting temporary vector configurations. |

## URS-004 DSL Requirements

SpockDSL is a minimal, uniform, almost natural DSL. All semantics described later must respect these requirements.

| Aspect | Requirement |
|--------|-------------|
| Statement shape | Any executable statement has the form `@varName subject verb object`. |
| Declaration rule | Each statement begins with `@varName`, which always declares a new variable in the current scope. |
| Macro header | Macro definitions use the fixed header `@MacroName declarationType begin` where `declarationType ∈ {theory, verb, session}`. |
| SSA discipline | Inside a macro body each `@name` appears exactly once on the left side of a statement. |
| Topological execution | Macro bodies are evaluated by topologically sorting the dependency graph induced by references; textual order is only a tie-breaker. |
| Verb parameters | Verbs are binary relations. Verb macros may use only `$subject` and `$object` as inputs, no additional parameters. |
| Special result | Verb macros must define `@result` exactly once; this hypervector is the output of the verb. |

## URS-005 Theory and Context Management

The system manages persistent theories, local sessions and theory versions.

| Aspect | Requirement |
|--------|-------------|
| Theories | Theories group facts and verb definitions as named macros and can be stored on disk. |
| Sessions | Sessions are local contexts used for temporary reasoning. Their variables disappear at the end unless persisted. |
| Use of theories | Sessions can overlay any number of theories by explicit commands, without copying global data. |
| Persistence | The verb `Remember` persists selected facts and definitions into named theories on disk. |
| Branching | The verb `BranchTheory` creates in-memory alternative versions of existing theories. |
| Merging | The verb `MergeTheory` merges two in-memory theory versions, with conflict resolution rules. |

## URS-006 Implementation Platform

| Aspect | Requirement |
|--------|-------------|
| Runtime | Implementation runs on Node.js. |
| Kernel | Geometric kernel uses typed arrays (e.g. Float32Array, integer arrays). |
| Vector dimensionality | Dimensionality and numeric type are configurable and can be tuned per installation. |
| Hardware | CPU-only execution must be efficient; no GPU is required. |

## URS-007 LLM Interface

| Aspect | Requirement |
|--------|-------------|
| Translation | LLMs can translate free text (EN/RO) to DSL scripts and back. |
| Theory generation | LLMs can generate new theories and verb definitions in DSL. |
| Execution | LLMs and other clients can execute scripts and read symbolic and numeric results. |

## URS-008 Explainability and Evaluation

The system must be transparent and evaluable.

| Aspect | Requirement |
|--------|-------------|
| DSL explainability | Every command executed via the API produces outputs that are explainable in DSL form: the resulting state can always be represented as one or more SpockDSL statements. |
| Execution logs | For complex reasoning, the engine can produce a DSL trace that reconstructs the reasoning trajectory. |
| Evaluation compatibility | The evaluation suite consumes and compares DSL scripts (DSL_TASK, DSL_OUTPUT). Natural language descriptions (NL_TASK, NL_OUTPUT) are not part of the core engine; engine outputs must be consistent with the DSL format. |

---

## Cross-Reference: URS to FS/NFS

| URS ID | Related FS | Related NFS |
|--------|-----------|-------------|
| URS-001 | FS-01, FS-02 | NFS-01 |
| URS-002 | FS-06 | - |
| URS-003 | FS-01 | NFS-01 |
| URS-004 | FS-03 | NFS-02 |
| URS-005 | FS-04 | NFS-02 |
| URS-006 | FS-01 | NFS-01 |
| URS-007 | FS-06 | NFS-03 |
| URS-008 | FS-07 | NFS-03 |
