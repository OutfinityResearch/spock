# Review Specificații vs. Implementare

## Status General

Specificațiile din `docs/specs/` sunt în general **bine aliniate** cu implementarea actuală. Acest document identifică punctele de convergență, discrepanțele minore și sugestiile de îmbunătățire.

---

## Convergențe (Specificații ↔ Implementare)

### ✅ Kernel Geometric (primitiveOps.js)

| Specificație | Implementare | Status |
|--------------|--------------|--------|
| 8 verbe kernel (Add, Bind, Negate, Distance, Move, Modulate, Identity, Normalise) | Toate implementate în `src/kernel/primitiveOps.js` | ✅ Complet |
| Modulate polimorfic (scalar/vector) | Detectare tip cu `typeof operand === 'number'` | ✅ Complet |
| Distance returnează similaritate cosinus normalizată [0,1] | `(cosineSim + 1) / 2` | ✅ Complet |
| Is NU e kernel verb | Definit în BaseLogic ca macro | ✅ Corect |

**Teste:** `tests/kernel/primitiveOps.test.js` acoperă toate verbele kernel cu 30+ teste.

### ✅ Vector Space (vectorSpace.js)

| Specificație | Implementare | Status |
|--------------|--------------|--------|
| createVector, createRandomVector | Implementate cu TypedArray | ✅ Complet |
| Generare Gaussiană/Bipolară | Configurabil prin `config.vectorGeneration` | ✅ Complet |
| Seeded random (Mulberry32) | `setRandomSeed()` funcțional | ✅ Complet |
| Funcții: dot, norm, normalise, cosineSimilarity, scale, addVectors, hadamard | Toate prezente | ✅ Complet |

### ✅ Parser DSL (parser.js)

| Specificație | Implementare | Status |
|--------------|--------------|--------|
| Formă statement: @varName subject verb object | Validare la 4 tokeni | ✅ Complet |
| Macro header: @MacroName type begin | Parsing corect | ✅ Complet |
| SSA: fiecare @name o singură dată | Verificare în `parseStatementLine` | ✅ Complet |
| Verb macro necesită @result | `validateAST()` verifică | ✅ Complet |

### ✅ Executor (executor.js)

| Specificație | Implementare | Status |
|--------------|--------------|--------|
| Dispatch verbe: kernel, numeric, planning, theory | Switch pe `verb.type` | ✅ Complet |
| Auto-generare concept pentru identificatori necunoscuți | `resolveSymbol()` cu `createRandomVector()` | ✅ Complet |
| Trace logging | Integrare cu `traceLogger` | ✅ Complet |
| Typed values (VECTOR, SCALAR, NUMERIC, MACRO) | `createTypedValue()` | ✅ Complet |

### ✅ Planificare (planner.js)

| Specificație | Implementare | Status |
|--------------|--------------|--------|
| Semantic Gradient Descent | Bucla `while (!goalReached)` cu findBestAction | ✅ Complet |
| Plan și Solve verbe | Ambele implementate | ✅ Complet |
| Strategii plateau: fail, random_restart, procedural_fallback | Toate suportate | ✅ Complet |
| Trace pentru DSL output | `result.trace` cu pași | ✅ Complet |

### ✅ Theory Versioning (theoryVersioning.js)

| Specificație | Implementare | Status |
|--------------|--------------|--------|
| UseTheory, Remember, BranchTheory, MergeTheory | THEORY_VERBS complet | ✅ Complet |
| Strategii merge: target, source, both, consensus, fail | Toate implementate | ✅ Complet |
| Version ID și parent tracking | generateVersionId() cu timestamp | ✅ Complet |
| Execuție teorie la UseTheory | Opțional via executeScript callback | ✅ Complet |

---

## Discrepanțe Minore

### ⚠️ 1. Distance: Numele vs. Semantica

**Specificație (DS_map.md):**
> `Distance(v1, v2) -> cosine similarity (returns scalar in [0,1])`

**Observație:**
Numele "Distance" sugerează că valorile mai mari = mai departe, dar implementarea returnează similaritate (valori mai mari = mai apropiate).

**Cod actual (primitiveOps.js:93-94):**
```javascript
const cosSim = vectorSpace.cosineSimilarity(a, b);
const result = (cosSim + 1) / 2;  // Returns similarity, not distance
```

**Sugestie:** Documentația este corectă ("similarity score"), dar numele funcției creează confuzie. Se poate:
1. Renumi la `Similarity` (breaking change)
2. Adăuga comentariu explicit în cod
3. Păstra așa dar clarifica în documentație

**Impact:** Scăzut - documentația e corectă

---

### ⚠️ 2. Evaluate verb: Locație în specificații

**Specificație (FS-02):**
> Evaluate is listed under "Logical / causal" verbs

**Implementare:**
- Nu e în kernel verbs (corect)
- Nu e în NUMERIC_VERBS
- Nu e în PLANNING_VERBS
- Nu e în THEORY_VERBS
- Este hardcodat în executor.js ca caz special (linia 215-217)

**Cod (executor.js):**
```javascript
if (verbName === 'Evaluate') {
    return { type: 'evaluate', name: 'Evaluate' };
}
```

**Sugestie:** Documentația ar trebui să menționeze că Evaluate este un verb special handling, nu parte dintr-o categorie standard. Alternativ, se poate crea un `LOGICAL_VERBS` registry.

---

### ⚠️ 3. Persist verb: Nedocumentat în specificații

**Implementare (executor.js:209-212):**
```javascript
if (verbName === 'Persist') {
    return { type: 'persist', name: 'Persist' };
}
```

**Specificație:** Nu apare în FS-02 (Verb Taxonomy).

**Sugestie:** Adăugare în specificații:

```markdown
| Verb | Category | Description |
|------|----------|-------------|
| `Persist` | Theory management | Pins a value in session, survives GC and appears in DSL_OUTPUT |
```

---

### ⚠️ 4. Tests: Fișiere menționate dar inexistente

**Specificație (DS_map.md lines 169, 176-177):**
```
tests/dsl/executor.session.test.js
tests/eval/taskLoader.test.js
tests/eval/evalRunner.test.js
```

**Realitate:**
- `tests/dsl/executor.test.js` există (nu "executor.session.test.js")
- `tests/eval/` nu există (evalSuite e în alt loc)

**Sugestie:** Actualizare DS_map.md să reflecte structura reală.

---

### ⚠️ 5. Viz Module: Menționate dar incomplete

**Specificație (DS_map.md lines 154-155, 178-179):**
- `src/viz/projectionService.js`
- `src/viz/vizApi.js`
- `tests/viz/projectionService.test.js`
- `tests/viz/vizApi.smoke.test.js`

**Realitate:**
- Fișierele există în `src/viz/`
- Testele sunt definite în specs dar nu verificate

**Sugestie:** Verificare și sincronizare.

---

### ⚠️ 6. Config Test: Path incorect

**Specificație (DS_tests_map.md):**
> `tests/config/config.test.js`

**Realitate:** Directorul `tests/config/` nu există în git status.

---

## Lacune în Specificații

### 📝 1. Runtime Type System: Tipuri adiționale

Implementarea include tipuri nespecificate în FS-01:

| Tip | Prezent în FS-01 | Prezent în cod |
|-----|------------------|----------------|
| VECTOR | ✅ | ✅ |
| SCALAR | ✅ | ✅ |
| NUMERIC | ✅ | ✅ |
| MACRO | ✅ | ✅ |
| PLAN | ❌ | ✅ (planner.js:433) |
| SOLUTION | ❌ | ✅ (planner.js:477) |
| THEORY | ❌ | ✅ (executor.js:367) |
| STRING | ❌ | ✅ (executor.js:144) |
| MEASURED | ❌ | ✅ (folosit în numeric) |
| FACT | ❌ | ✅ (theoryVersioning.js:512) |

**Sugestie:** Extindere FS-01 Runtime Type System cu toate tipurile.

---

### 📝 2. Debug Logger: Nedocumentat

**Implementare:** `src/logging/debugLogger.js` (menționat în git status ca nou)

**Specificație:** Niciuna

**Sugestie:** Adăugare în NFS-03 (Observability):
```markdown
| `debugLogger.js` | Granular debug logging per module (kernel, dsl, theory, etc.) |
```

---

### 📝 3. Result Theory: Nedocumentat

**Implementare:** `src/api/resultTheory.js` (menționat în git status ca nou)

**Specificație:** FS-07 menționează "DSL output" dar nu structura specifică.

**Sugestie:** Documentare format:
```javascript
{
  subject: 'query',
  verb: 'HasTruth',
  truth: 0.85,
  confidence: 0.7
}
```

---

## Recomandări de Actualizare

### Prioritate Înaltă

1. **DS_map.md**: Actualizare liste de fișiere să reflecte realitatea
2. **FS-01**: Extindere Runtime Type System cu PLAN, SOLUTION, THEORY, STRING, MEASURED, FACT
3. **FS-02**: Adăugare Persist și clarificare Evaluate

### Prioritate Medie

4. **NFS-03**: Adăugare debugLogger.js
5. **FS-07**: Detaliere structură resultTheory

### Prioritate Scăzută

6. Clarificare semantică Distance vs. Similarity (doar documentație)

---

## Concluzie

Implementarea este **matură și bine aliniată** cu specificațiile. Discrepanțele identificate sunt minore și țin mai mult de documentație decât de funcționalitate. Sistemul respectă principiile arhitecturale:

- ✅ Stratificare clară (kernel → DSL → API)
- ✅ Tipare pure pentru kernel
- ✅ Dependency injection pentru testing
- ✅ Trace logging pentru explicabilitate
- ✅ Configurabilitate centralizată

Teoria fundamentală (hipervectori, adevăr geometric, raționament continuu) este corect implementată și documentată.
