# DS src/dsl/dependencyGraph.js

## Overview

| Field | Value |
|-------|-------|
| **Primary role** | Build dependency DAGs between statements inside a macro and compute a topological execution order. |
| **Public functions** | `buildGraph(astMacro)`, `topoSort(graph)` |
| **Depends on** | None |
| **Used by** | `src/dsl/executor.js` |

## Traceability

| Specification | IDs |
|---------------|-----|
| **Implements URS** | URS-004 DSL requirements (topological evaluation) |
| **Implements FS** | FS-03 SpockDSL syntax and macro semantics |
| **Implements DS** | DS DSL engine and execution |

## Graph Structure

```javascript
{
  nodes: Map<string, Statement>,  // declaration -> statement AST
  edges: Map<string, string[]>,   // declaration -> [dependencies]
  order: string[]                 // Computed execution order
}
```

## Function Specifications

### `buildGraph(astMacro)`

Constructs a dependency graph from a macro's body.

**Parameters:**
- `astMacro` (MacroAST): Parsed macro AST

**Returns:**
- Graph object with nodes and edges

**Behaviour:**
1. For each statement, extract the `@declaration`
2. Identify references in subject, verb, object
3. Create edges from the statement to its dependencies
4. Detect and report cycles

**Example:**

```spockdsl
@Logic theory begin
    @fact1 a In b
    @fact2 b In c
    @premise fact1 And fact2
    @conclusion a In c
end
```

Graph edges:
- `@premise` → [`@fact1`, `@fact2`]
- `@conclusion` → [] (no dependencies on other statements)
- `@fact1` → []
- `@fact2` → []

### `topoSort(graph)`

Computes a valid topological order for statement execution.

**Parameters:**
- `graph` (Graph): Dependency graph from `buildGraph`

**Returns:**
- Array of declaration names in execution order

**Algorithm:**
1. Compute in-degree for each node
2. Initialize queue with nodes having in-degree 0
3. Process queue, decrementing in-degrees
4. Return order, or throw if cycle detected

**Tie-breaking:**
When multiple nodes have in-degree 0, use textual order (line number) as tie-breaker.

**Error Handling:**
- Throws `CycleError` if circular dependencies exist
- Reports which declarations form the cycle

## Cycle Detection Example

```spockdsl
@Broken theory begin
    @a b Uses c
    @b c Uses a   # Circular!
end
```

Error: "Cycle detected: @a → @b → @a"
