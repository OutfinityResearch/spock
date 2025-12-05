# NFS – Non-Functional Specifications

## NFS-01 Performance and Resource Usage

| Aspect | Non-functional requirement |
|--------|---------------------------|
| Time performance | Typical reasoning scripts in evaluation suites must execute within bounded time on commodity CPU, relying on simple vector operations and avoiding unnecessary copies. |
| Memory usage | Vector creation is centralised in `vectorSpace.js`; modules should avoid retaining unused vectors, and sessions should be able to drop all local state at end of life. |
| Scaling | The engine must support increasing vector dimensionality and theory size by adjusting configuration without structural changes to modules. |

## NFS-02 Testability and Modularity

| Aspect | Non-functional requirement |
|--------|---------------------------|
| Small modules | Each file exposes only a small number of public functions, with clear responsibilities, making unit testing straightforward. |
| Pure functions | Core computation (kernels, parser, dependency graph) is implemented as pure functions whenever possible, without hidden global state. |
| Dependency direction | Low-level modules (kernel, dsl) do not depend on high-level modules (api, viz), preventing cycles and simplifying mocking in tests. |
| Isolation | I/O is localised in `theoryStore.js`, `taskLoader.js` and `vizApi.js`; core reasoning can be tested entirely in memory. |

## NFS-03 Explainability and Observability

| Aspect | Non-functional requirement |
|--------|---------------------------|
| DSL traceability | `traceLogger.js` must allow reconstruction of the computation as a valid DSL script (`DSL_OUTPUT`) for any command issued via the public API. |
| Logging levels | Logging should be configurable (silent, summary, full trace) via `config.js` to adapt to development, evaluation and production. |
| Error reporting | Parser and executor must return precise errors with line numbers and symbol names to support quick debugging. |

## NFS-04 Deployment and Configuration

| Aspect | Non-functional requirement |
|--------|---------------------------|
| Configuration | All run-time parameters (dimensions, numeric types, theory paths, eval paths, viz server ports) are centrally managed in `config.js`. |
| Environment | The system runs entirely on Node.js with no hard GPU dependency. |
| Portability | File paths and OS-specific details are abstracted in `config.js` and `theoryStore.js` so that deployments on different platforms require minimal changes. |

---

## Cross-Reference: NFS to URS/FS

| NFS ID | Related URS | Related FS |
|--------|-------------|------------|
| NFS-01 | URS-001, URS-003, URS-006 | FS-01, FS-02, FS-05 |
| NFS-02 | URS-004, URS-005 | FS-03, FS-04 |
| NFS-03 | URS-007, URS-008 | FS-06, FS-07 |
| NFS-04 | URS-006 | FS-01 |
