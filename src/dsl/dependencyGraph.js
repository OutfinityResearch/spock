/**
 * @fileoverview Dependency graph construction and topological sorting
 * @implements URS-004, FS-03, DS DSL
 */

'use strict';

/**
 * Error for circular dependencies
 */
class CycleError extends Error {
  constructor(cycle) {
    super(`Circular dependency detected: ${cycle.join(' → ')}`);
    this.name = 'CycleError';
    this.cycle = cycle;
  }
}

/**
 * Extracts references from a statement (names it depends on)
 * @param {Object} statement - Statement AST node
 * @returns {Array<string>} Referenced names (declarations it depends on)
 */
function extractReferences(statement) {
  const refs = [];

  // Subject might reference another declaration
  if (statement.subject.startsWith('@') || statement.subject.startsWith('$')) {
    const name = statement.subject.startsWith('$')
      ? `@${statement.subject.slice(1)}`
      : statement.subject;
    refs.push(name);
  }

  // Verb - if it's a user-defined verb macro, it's a reference
  // For now, we don't track verb references as dependencies
  // (verbs are resolved at runtime, not compile time)

  // Object might reference another declaration
  if (statement.object.startsWith('@') || statement.object.startsWith('$')) {
    const name = statement.object.startsWith('$')
      ? `@${statement.object.slice(1)}`
      : statement.object;
    refs.push(name);
  }

  return refs;
}

/**
 * Builds a dependency graph from a macro's body
 * @param {Object} macro - Macro AST node
 * @returns {Object} Graph with nodes and edges
 */
function buildGraph(macro) {
  const nodes = new Map();  // declaration -> statement
  const edges = new Map();  // declaration -> [dependencies]

  // Register all statements as nodes
  for (const stmt of macro.body) {
    nodes.set(stmt.declaration, stmt);
    edges.set(stmt.declaration, []);
  }

  // Build edges based on references
  for (const stmt of macro.body) {
    const refs = extractReferences(stmt);
    const deps = [];

    for (const ref of refs) {
      // Only add edge if reference is to a local declaration
      if (nodes.has(ref)) {
        deps.push(ref);
      }
      // External references (to theories, constants) are not dependencies
      // in the topological sort sense - they're resolved at runtime
    }

    // Deduplicate dependencies to avoid inflating in-degree counts
    const uniqueDeps = Array.from(new Set(deps));

    edges.set(stmt.declaration, uniqueDeps);
  }

  return { nodes, edges };
}

/**
 * Performs topological sort using Kahn's algorithm
 * @param {Object} graph - Graph with nodes and edges
 * @returns {Array<string>} Declarations in execution order
 * @throws {CycleError} If cycle detected
 */
function topoSort(graph) {
  const { nodes, edges } = graph;

  // Compute in-degrees
  const inDegree = new Map();
  for (const decl of nodes.keys()) {
    inDegree.set(decl, 0);
  }

  for (const [decl, deps] of edges) {
    for (const dep of deps) {
      if (inDegree.has(dep)) {
        // dep is depended upon by decl
        // We need reverse: decl depends on dep
      }
    }
  }

  // Actually compute in-degrees correctly:
  // edge from A to B means A depends on B
  // So B must come before A
  // In-degree of A = number of nodes that must come before A
  for (const decl of nodes.keys()) {
    inDegree.set(decl, edges.get(decl).length);
  }

  // Initialize queue with nodes having in-degree 0
  // Sort by line number for deterministic tie-breaking
  const statements = Array.from(nodes.values());
  statements.sort((a, b) => a.line - b.line);

  const queue = [];
  for (const stmt of statements) {
    if (inDegree.get(stmt.declaration) === 0) {
      queue.push(stmt.declaration);
    }
  }

  const order = [];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    visited.add(current);

    // Find all nodes that depend on current
    for (const [decl, deps] of edges) {
      if (deps.includes(current) && !visited.has(decl)) {
        const newDegree = inDegree.get(decl) - 1;
        inDegree.set(decl, newDegree);

        if (newDegree === 0) {
          // Insert maintaining line order
          const stmt = nodes.get(decl);
          let inserted = false;
          for (let i = 0; i < queue.length; i++) {
            const qStmt = nodes.get(queue[i]);
            if (stmt.line < qStmt.line) {
              queue.splice(i, 0, decl);
              inserted = true;
              break;
            }
          }
          if (!inserted) {
            queue.push(decl);
          }
        }
      }
    }
  }

  // Check for cycle
  if (order.length !== nodes.size) {
    // Find cycle
    const cycle = findCycle(edges, visited);
    throw new CycleError(cycle);
  }

  return order;
}

/**
 * Finds a cycle in the graph (for error reporting)
 * @param {Map} edges - Edge map
 * @param {Set} visited - Already processed nodes
 * @returns {Array<string>} Cycle path
 */
function findCycle(edges, visited) {
  const unvisited = [];
  for (const decl of edges.keys()) {
    if (!visited.has(decl)) {
      unvisited.push(decl);
    }
  }

  if (unvisited.length === 0) return [];

  // DFS to find cycle
  const path = [];
  const inPath = new Set();

  function dfs(node) {
    if (inPath.has(node)) {
      // Found cycle
      const cycleStart = path.indexOf(node);
      return [...path.slice(cycleStart), node];
    }
    if (visited.has(node)) return null;

    path.push(node);
    inPath.add(node);

    for (const dep of edges.get(node) || []) {
      const cycle = dfs(dep);
      if (cycle) return cycle;
    }

    path.pop();
    inPath.delete(node);
    return null;
  }

  for (const start of unvisited) {
    const cycle = dfs(start);
    if (cycle) return cycle;
  }

  return unvisited;
}

/**
 * Gets execution order for a macro's statements
 * @param {Object} macro - Macro AST node
 * @returns {Array<Object>} Statements in execution order
 */
function getExecutionOrder(macro) {
  const graph = buildGraph(macro);
  const order = topoSort(graph);
  return order.map(decl => graph.nodes.get(decl));
}

/**
 * Validates that all references in a macro are resolvable
 * @param {Object} macro - Macro AST node
 * @param {Set<string>} externalSymbols - Available external symbols
 * @returns {Array<Object>} Unresolved references (empty if all valid)
 */
function validateReferences(macro, externalSymbols = new Set()) {
  const localDecls = new Set(macro.body.map(s => s.declaration));
  const unresolved = [];

  for (const stmt of macro.body) {
    const refs = extractReferences(stmt);
    for (const ref of refs) {
      if (!localDecls.has(ref) && !externalSymbols.has(ref)) {
        unresolved.push({
          reference: ref,
          statement: stmt,
          line: stmt.line
        });
      }
    }
  }

  return unresolved;
}

module.exports = {
  buildGraph,
  topoSort,
  getExecutionOrder,
  extractReferences,
  validateReferences,
  CycleError
};
