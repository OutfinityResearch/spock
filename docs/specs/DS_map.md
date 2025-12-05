# DS – Design Specifications

## DS Kernel Architecture

The kernel architecture realises the conceptual model and DSL semantics.

| Component | Description |
|-----------|-------------|
| Geometric kernel | Manages hypervectors, allocation, primitive operations and similarity computations using typed arrays in Node.js. |
| Numeric kernel | Handles numeric values, units and numeric operations, integrated with the geometric kernel. |
| Symbol tables | Maintain mappings from names to runtime objects for global theories and sessions. |

### Primitive Operations

```javascript
Add(v1, v2)      -> v1 + v2
Bind(v1, v2)     -> elementwise product or circular convolution
Negate(v)        -> -v
Distance(v1, v2) -> cosine similarity or derived metric
Move(state, d)   -> state + d
Modulate(x, g)   -> x * g
```

Numeric kernel operations are defined analogously with unit checking and conversion.

## DS DSL Engine and Execution

The DSL engine parses scripts, constructs dependency graphs and executes statements.

| Aspect | Design |
|--------|--------|
| Parsing | Tokenisation is space-based. Statements and macro headers are identified by position. Comments start at `#` and run to end of line. |
| Macro representation | Macros are stored as simple ASTs: header plus list of statements. |
| Dependency analysis | For each macro, the engine analyses usages of names to build a DAG between statements. |
| Topological sort | Execution order is computed via topological sorting of the DAG. |

### Execution Flow Inside a Macro

1. Collect all `@` declarations and references.
2. Build the dependency graph according to SSA rules.
3. Compute a topological order.
4. For each statement in this order:
   - Resolve subject, verb, object from the current context.
   - Dispatch to the appropriate verb implementation (geometric or numeric).
   - Store the result under the declared `@varName`.
5. For verb macros, after the macro body is executed, the value associated with `@result` becomes the verb output.

## DS Theory Storage and Versioning

The theory manager handles persistent storage, versioning and overlays.

| Aspect | Design |
|--------|--------|
| Storage layout | A directory `.spock` contains one subdirectory per theory. Each theory contains one or more `.spockdsl` files. |
| Metadata | Theory metadata records `theoryId`, `versionId` and `parentVersionId`. |
| Loading | The engine loads theories from disk on demand and keeps them in memory as ASTs and vector prototypes. |
| Overlays | `UseTheory` adds a reference to a theory into the session context so that its symbols are visible for name resolution. |

### Branching and Merging

```spockdsl
@branchPhysics ClassicalPhysics BranchTheory ExperimentalPhysics
@mergePhysics ExperimentalPhysics MergeTheory ClassicalPhysics
```

`BranchTheory` creates an in-memory branch; `MergeTheory` combines two versions. The resulting theory may then be persisted with `Remember`.

## DS Numeric Kernel and Physical Quantities

The numeric kernel is integrated with the geometric kernel but uses its own internal representation.

| Aspect | Design |
|--------|--------|
| Runtime value | `NumericValue` holds scalar or vector values and optional units. |
| Unit handling | Units are represented as symbols with internal structures that allow composition (e.g. `m_per_s` for velocity). |
| Integration | Numeric verbs share the same statement form and execution engine as geometric verbs, but dispatch into the numeric kernel. |

### Example: Force Computation

```spockdsl
@ComputeForce verb begin
    @mass subject
    @accel object
    @forceValue mass MulNumeric accel
    @forceWithUnit forceValue AttachUnit N
    @result forceWithUnit AttachToConcept Force
end
```

## DS Visualisation and Interaction

The visualisation subsystem provides 2D/3D projections of and interaction with the conceptual space.

| Aspect | Design |
|--------|--------|
| Projection service | A module receives sets of vectors and returns 2D or 3D coordinates using PCA, UMAP or similar methods. |
| Trajectory logging | Each executed statement can be logged with its resulting vector, verb and inputs to build reasoning trajectories. |
| API endpoints | HTTP or WebSocket endpoints expose concept projections and trajectories for front-end visualisation. |

A simple HTTP UI can provide a chat for natural-language queries translated into DSL, a list of active theories and sessions, and scatter plots with overlays of reasoning trajectories. Selecting a point can reveal the DSL statement that produced it.

## DS Evaluation Suite Implementation

The evaluation suite executes deterministic tests over the engine and checks explainable DSL outputs.

| Element | Description |
|---------|-------------|
| Suite folder | Each suite has a folder under `evalSuite` containing an additional theory and a tasks file. |
| Task record | Each record contains `NL_TASK`, `TASK_TYPE`, `DSL_TASK`, `DSL_OUTPUT`, `NL_OUTPUT`. |
| Execution | For each task the evaluator runs `DSL_TASK` with the engine and compares the obtained state with `DSL_OUTPUT`. |
| Statistics | The evaluator records the number of reasoning steps and whether the task passed. |

At the end of each run the evaluator prints a compact table: one line per suite, listing the step counts for each task with fixed-width columns. All results must be reproducible and their final states must be expressible as DSL scripts, aligned with the global explainability requirement.

---

## DS Source Code Map

| File | Primary Role | Implements |
|------|--------------|------------|
| [src/kernel/vectorSpace.js](src/kernel/vectorSpace.js.md) | Manage hypervector storage and basic vector math helpers | URS-003, URS-006, FS-01, DS Kernel |
| [src/kernel/primitiveOps.js](src/kernel/primitiveOps.js.md) | Implement geometric primitive verbs | URS-003, FS-02, FS-03, DS Kernel |
| [src/kernel/numericKernel.js](src/kernel/numericKernel.js.md) | Represent numeric runtime values and operations | URS-003, FS-05, DS Numeric |
| [src/dsl/tokenizer.js](src/dsl/tokenizer.js.md) | Split raw DSL text into tokens | URS-004, FS-03, DS DSL |
| [src/dsl/parser.js](src/dsl/parser.js.md) | Convert token streams into AST | URS-004, FS-03, DS DSL |
| [src/dsl/dependencyGraph.js](src/dsl/dependencyGraph.js.md) | Build dependency DAGs and topological sort | URS-004, FS-03, DS DSL |
| [src/dsl/executor.js](src/dsl/executor.js.md) | Execute parsed scripts and macros | URS-004, URS-008, FS-01, FS-03, FS-07, DS DSL |
| [src/theory/theoryStore.js](src/theory/theoryStore.js.md) | Load, save and list theories on disk | URS-005, URS-006, FS-04, DS Theory |
| [src/theory/theoryVersioning.js](src/theory/theoryVersioning.js.md) | Implement branching and merging of theories | URS-005, FS-04, DS Theory |
| [src/session/sessionManager.js](src/session/sessionManager.js.md) | Create and manage sessions | URS-005, URS-006, FS-01, FS-04, DS Kernel |
| [src/logging/traceLogger.js](src/logging/traceLogger.js.md) | Record execution traces as DSL statements | URS-008, FS-07, DS DSL |
| [src/api/engineFactory.js](src/api/engineFactory.js.md) | Main public entry point createSpockEngine | URS-006, URS-007, FS-06, DS Kernel |
| [src/api/sessionApi.js](src/api/sessionApi.js.md) | High-level Session API facade | URS-007, URS-008, FS-06, FS-07, DS DSL |
| [src/viz/projectionService.js](src/viz/projectionService.js.md) | Project high-dimensional vectors to 2D/3D | URS-003, FS-01, DS Viz |
| [src/viz/vizApi.js](src/viz/vizApi.js.md) | HTTP/WebSocket endpoints for visualisation | URS-006, URS-007, FS-06, DS Viz |
| [src/config/config.js](src/config/config.js.md) | Central configuration management | URS-006, FS-01, DS Kernel |

## DS Test Suite Map

| File | Primary Role | Test Style |
|------|--------------|------------|
| [tests/run.js](tests/run.js.md) | Main test runner orchestrator | Developer testing |
| [tests/kernel/vectorSpace.test.js](tests/kernel/vectorSpace.test.js.md) | Unit tests for vectorSpace.js | Pure unit tests |
| [tests/kernel/primitiveOps.test.js](tests/kernel/primitiveOps.test.js.md) | Unit tests for primitiveOps.js | Pure unit tests |
| [tests/kernel/numericKernel.test.js](tests/kernel/numericKernel.test.js.md) | Unit tests for numericKernel.js | Pure unit tests |
| [tests/dsl/tokenizer.test.js](tests/dsl/tokenizer.test.js.md) | Unit tests for tokenizer.js | Pure unit tests |
| [tests/dsl/parser.test.js](tests/dsl/parser.test.js.md) | Unit tests for parser.js | Mostly unit tests |
| [tests/dsl/dependencyGraph.test.js](tests/dsl/dependencyGraph.test.js.md) | Unit tests for dependencyGraph.js | Pure unit tests |
| [tests/dsl/executor.session.test.js](tests/dsl/executor.session.test.js.md) | Integration tests for executor.js | Developer integration |
| [tests/theory/theoryStore.test.js](tests/theory/theoryStore.test.js.md) | Tests for theoryStore.js | Developer tests (I/O) |
| [tests/theory/theoryVersioning.test.js](tests/theory/theoryVersioning.test.js.md) | Tests for theoryVersioning.js | Mostly unit tests |
| [tests/session/sessionManager.test.js](tests/session/sessionManager.test.js.md) | Tests for sessionManager.js | Developer tests |
| [tests/logging/traceLogger.test.js](tests/logging/traceLogger.test.js.md) | Unit tests for traceLogger.js | Pure unit tests |
| [tests/api/engineFactory.test.js](tests/api/engineFactory.test.js.md) | Developer tests for engineFactory.js | Developer integration |
| [tests/api/sessionApi.test.js](tests/api/sessionApi.test.js.md) | Integration tests for sessionApi.js | Developer testing |
| [tests/eval/taskLoader.test.js](tests/eval/taskLoader.test.js.md) | Tests for taskLoader.js | Developer tests (I/O) |
| [tests/eval/evalRunner.test.js](tests/eval/evalRunner.test.js.md) | Smoke and behavioural tests for evalRunner.js | Developer integration |
| [tests/viz/projectionService.test.js](tests/viz/projectionService.test.js.md) | Unit tests for projectionService.js | Mostly unit tests |
| [tests/viz/vizApi.smoke.test.js](tests/viz/vizApi.smoke.test.js.md) | Smoke tests for vizApi.js | Developer smoke |
| [tests/config/config.test.js](tests/config/config.test.js.md) | Unit tests for config.js | Pure unit tests |

## DS EvalSuite Map

| Case | Goal | Theory Focus |
|------|------|--------------|
| [01-basic-logic](evalSuite/01-basic-logic.md) | Test basic logical operations | Core BasicLogic theory |
| [02-transitivity-syllogism](evalSuite/02-transitivity-syllogism.md) | Test transitivity and syllogisms | TransitivityTheory |
| [03-numeric-quantities](evalSuite/03-numeric-quantities.md) | Test numeric handling | NumericExamples theory |
| [04-physics-gravity](evalSuite/04-physics-gravity.md) | Test physical reasoning | GravityTheory |
| [05-planning-linear](evalSuite/05-planning-linear.md) | Test linear planning | LinearPlanning theory |
| [06-explanation-causality](evalSuite/06-explanation-causality.md) | Test causal chains and explanation | CausalityTheory |
| [07-puzzle-solving](evalSuite/07-puzzle-solving.md) | Test constraint-based reasoning | PuzzleTheory |
| [08-theory-versioning](evalSuite/08-theory-versioning.md) | Test theory branching and merging | MeasurementTheory |
| [09-summarisation-detail](evalSuite/09-summarisation-detail.md) | Test summarisation and detail expansion | SummaryTheory |
| [10-mixed-reasoning](evalSuite/10-mixed-reasoning.md) | Test mixed scenario across theories | Combined theories |
