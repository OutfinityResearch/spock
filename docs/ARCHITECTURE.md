# Spock: Geometric Operating System for Neuro-Symbolic Reasoning

## Teoria Fundamentală

### De ce funcționează Spock?

Spock se bazează pe o idee profundă din matematică și știința cognitivă: **conceptele pot fi reprezentate ca puncte într-un spațiu geometric de înaltă dimensionalitate**, iar **raționamentul devine navigare prin acest spațiu**.

#### Principiul Central: Spațiul Conceptual

Imaginați-vă un spațiu cu 512 dimensiuni (sau mai multe). Fiecare concept - "câine", "mamifer", "iubire", "cauză" - este un punct în acest spațiu. Conceptele similare sunt geometric apropiate; conceptele diferite sunt depărtate.

```
                    ↑ dimensiunea semantică Y
                    │
        [Mamifer]   │   [Pasăre]
           ●────────│────●
          /│        │    │
         / │        │    │
    [Câine]●        │    ●[Vultur]
                    │
   ─────────────────┼─────────────────→ dimensiunea semantică X
                    │
                    │
        [Pește]●    │    ●[Reptilă]
                    │
```

#### De ce hipervectori aleatori?

Proprietatea fundamentală care face sistemul să funcționeze:

> **În spații de dimensionalitate înaltă, vectorii aleatori sunt aproape ortogonali.**

Dacă generezi doi vectori aleatori în 512 dimensiuni, probabilitatea ca ei să fie corelați semnificativ este neglijabilă (~1/√512 ≈ 4%). Aceasta înseamnă că:

- **Concepte noi** pot fi generate fără coordonare globală
- **Coliziuni** între concepte sunt virtual imposibile
- **Robustețe** la zgomot și perturbații

Această proprietate este fundamentul **Vector Symbolic Architectures (VSA)** și al calculului hiperdimensional.

#### Adevărul ca Direcție

Una dintre inovațiile elegante ale lui Spock:

> **Adevărul nu este un boolean, ci o direcție în spațiu.**

Există un vector canonic `Truth` (generat aleator la inițializare). O propoziție este "adevărată" în măsura în care vectorul ei este aliniat cu `Truth`:

```
Truth ●───────────────→  (direcția adevărului)
      ↑
      │ cos(θ) = 0.8  →  80% adevărat
      │
      ●
   [Propoziție]
```

Aceasta permite:
- **Adevăruri parțiale**: `0.7 * Truth` = 70% adevărat
- **Negație**: `-Truth` = fals
- **Incertitudine**: vectori ortogonali pe Truth = neutru
- **Compunere**: adunarea vectorilor adevăr acumulează evidența

---

## Arhitectura Sistemului

### Straturile Conceptuale

```
┌─────────────────────────────────────────────────────────────────┐
│                      API PUBLIC (FS-06)                         │
│  createSpockEngine() → engine.createSession() → session.ask()  │
├─────────────────────────────────────────────────────────────────┤
│                     SESSION API (FS-06, FS-07)                  │
│  learn() | ask() | prove() | explain() | plan() | solve()      │
├─────────────────────────────────────────────────────────────────┤
│                      DSL EXECUTOR (FS-03)                       │
│  parse → dependencyGraph → topologicalSort → execute           │
├─────────────────────────────────────────────────────────────────┤
│                    VERB DISPATCH (FS-02)                        │
│  Kernel | Numeric | Planning | Theory | User-defined           │
├─────────────────────────────────────────────────────────────────┤
│                   GEOMETRIC KERNEL (DS-Kernel)                  │
│  Add | Bind | Negate | Distance | Move | Modulate | Normalise  │
├─────────────────────────────────────────────────────────────────┤
│                  VECTOR SPACE (URS-003, URS-006)                │
│  createVector | createRandomVector | dot | norm | cosineSim    │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxul de Date

```
SpockDSL Script                  Rezultat
      │                              ↑
      ▼                              │
┌──────────┐                   ┌──────────┐
│ Tokenizer│                   │  Trace   │
└────┬─────┘                   │  Logger  │
     │                         └────┬─────┘
     ▼                              │
┌──────────┐                   ┌──────────┐
│  Parser  │                   │ Result   │
│   (AST)  │                   │ Theory   │
└────┬─────┘                   └────┬─────┘
     │                              ↑
     ▼                              │
┌──────────┐                   ┌──────────┐
│ Dependency                   │ Typed    │
│  Graph   │                   │ Values   │
└────┬─────┘                   └────┬─────┘
     │                              ↑
     ▼                              │
┌──────────────────────────────────────────┐
│            EXECUTOR                       │
│  ┌────────┐  ┌────────┐  ┌────────┐     │
│  │ Kernel │  │Numeric │  │Planning│     │
│  │ Verbs  │  │ Verbs  │  │ Verbs  │     │
│  └────────┘  └────────┘  └────────┘     │
└──────────────────────────────────────────┘
```

---

## SpockDSL: Limbajul

### Sintaxa Fundamentală

Fiecare instrucțiune are forma:

```
@varName subject verb object
```

- `@varName`: Declarație (creează o nouă variabilă)
- `subject`: Referință la concept/fapt existent
- `verb`: Operația de efectuat
- `object`: Al doilea operand

### Exemplu: Silogism

```spockdsl
@fact1 Socrates Is Human
@fact2 Human Are Mortal
@conclusion Socrates Is Mortal
@proof fact1 Implies conclusion
```

Interpretare geometrică:
1. `Socrates Is Human` → `Bind(Socrates, Human)` + `Move` → vector în spațiu
2. `Human Are Mortal` → relație nouă
3. Inferența `Implies` verifică alinierea geometrică între premisă și concluzie

### Macro-uri

```spockdsl
@MyVerb verb begin
    @step1 $subject Bind Role
    @step2 step1 Add $object
    @result step2 Normalise _
end
```

- `$subject`, `$object`: Variabile magice (input-uri)
- `@result`: Output-ul obligatoriu al verbului

---

## Taxonomia Verbelor

### 1. Verbe Kernel (8 operații primitive)

| Verb | Operație | Semantică |
|------|----------|-----------|
| `Add` | v₁ + v₂ | Superpoziție (blend concepts) |
| `Bind` | v₁ ⊙ v₂ | Produs Hadamard (asociere role-filler) |
| `Negate` | -v | Negație logică |
| `Distance` | cos(v₁, v₂) | Similaritate (0=ortogonal, 1=identic) |
| `Move` | v₁ + v₂ | Tranziție de stare |
| `Modulate` | v × scalar sau v₁ ⊙ v₂ | Scalare/gating polimorfic |
| `Identity` | v | Pass-through |
| `Normalise` | v / ‖v‖ | Proiecție pe sfera unitate |

### 2. Verbe Numerice

| Verb | Descriere |
|------|-----------|
| `HasNumericValue` | Creează valoare numerică |
| `AttachUnit` | Atașează unitate de măsură |
| `AddNumeric` / `SubNumeric` | Operații aritmetice cu unități |
| `MulNumeric` / `DivNumeric` | Multiplicare/împărțire |
| `AttachToConcept` | Leagă numeric de vector |
| `ProjectNumeric` | Extrage valoare din concept |

### 3. Verbe de Planificare

| Verb | Descriere |
|------|-----------|
| `Plan` | Generează secvență de acțiuni spre țintă |
| `Solve` | Găsește soluție pentru constrângeri |

**Algoritmul: Semantic Gradient Descent**

```
while distance(current, goal) > ε:
    for each action in available_actions:
        next_state = apply(action, current)
        score = similarity(next_state, goal)
        candidates.append((action, next_state, score))

    best = argmax(candidates, by=score)
    if best.score <= current_score:
        handle_plateau()  # fail | random_restart | procedural_fallback

    current = best.next_state
    plan.append(best.action)
```

### 4. Verbe de Teorie

| Verb | Descriere |
|------|-----------|
| `UseTheory` | Încarcă teorie în sesiune (overlay) |
| `Remember` | Persistă fapte în teorie |
| `BranchTheory` | Creează ramură din teorie existentă |
| `MergeTheory` | Combină două ramuri |

### 5. Verbul Evaluate

Verbul special `Evaluate` proiectează un vector pe axa adevărului:

```
scalar = Distance(vector, Truth)  # similaritate cosinus
truth_score = (scalar + 1) / 2    # normalizat în [0, 1]
```

---

## Sistemul de Tipuri Runtime

| Tip | Reprezentare | Descriere |
|-----|--------------|-----------|
| `VECTOR` | `Float32Array` | Hipervector în spațiul conceptual |
| `SCALAR` | `number` | Valoare numerică (ex: de la `Distance`) |
| `NUMERIC` | `{value, unit}` | Valoare măsurată cu unitate |
| `MACRO` | `{ast}` | Definiție de verb sau teorie |
| `PLAN` | `{steps, trace}` | Rezultat de planificare |
| `SOLUTION` | `{solution, violations}` | Rezultat de rezolvare |

---

## Teorii și Versionare

### Modelul de Overlay

```
┌─────────────────────────────────────┐
│           SESSION                    │
│  ┌──────────────────────────────┐   │
│  │ Local Symbols (@declarations)│   │
│  └──────────────────────────────┘   │
│         ↓ lookup (LIFO)             │
│  ┌──────────────────────────────┐   │
│  │ Theory Overlay 2 (most recent)│   │
│  └──────────────────────────────┘   │
│         ↓                            │
│  ┌──────────────────────────────┐   │
│  │ Theory Overlay 1              │   │
│  └──────────────────────────────┘   │
│         ↓                            │
│  ┌──────────────────────────────┐   │
│  │ Global Symbols (Truth, False)│   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Versionare cu Git-like Semantics

```
v1 (BaseLogic)
 ├── v2 (BaseLogic__experiment1)
 │    └── v4 (merged: experiment1 + experiment2)
 └── v3 (BaseLogic__experiment2)
```

**Strategii de Merge:**

| Strategie | Comportament |
|-----------|--------------|
| `target` | Păstrează versiunea țintă la conflicte |
| `source` | Folosește versiunea sursă |
| `both` | Păstrează ambele (redenumește sursa cu `_merged`) |
| `consensus` | Media geometrică: `Normalise(Add(target, source))` |
| `fail` | Aruncă eroare la orice conflict |

---

## Explicabilitate (FS-07)

### Dual Output Strategy

Fiecare operație API produce:

1. **resultTheory**: Output curat pentru producție
2. **executionTrace**: Log complet pentru debugging/evaluare

```javascript
{
  success: true,
  score: 0.85,
  resultTheory: "@conclusion Query HasTruth 0.85",
  executionTrace: `
    @step1 A Bind B
    @step2 step1 Move C
    @result step2 Evaluate Truth
  `
}
```

### Trace Logger

```javascript
startTrace(traceId);
logStep(traceId, {
  dslStatement: "@fact Subject Verb Object",
  inputs: { subject: "A", verb: "Is", object: "B" },
  output: { declaration: "@fact", type: "VECTOR" }
});
endTrace(traceId);  // → exportable DSL script
```

---

## Configurație

| Parametru | Default | Descriere |
|-----------|---------|-----------|
| `dimensions` | 512 | Dimensionalitatea hipervectorilor |
| `numericType` | 'Float32Array' | Tipul numeric pentru vectori |
| `vectorGeneration` | 'gaussian' | 'gaussian' sau 'bipolar' |
| `planningEpsilon` | 0.05 | Prag pentru atingerea țintei |
| `maxPlanningSteps` | 100 | Limită de iterații pentru planificare |
| `plateauStrategy` | 'fail' | Strategia pentru platouri |
| `theoriesPath` | '.spock/theories' | Calea pentru persistența teoriilor |

---

## De ce merge?

### 1. Fundamentul Matematic

- **Înaltă dimensionalitate** → vectori aleatori sunt quasi-ortogonali
- **Coerență semantică** → concepte similare = vectori aliniați
- **Continuitate** → transformările sunt smooth (homotopice)

### 2. Beneficii Practice

- **Raționament fuzzy nativ** → nu există doar adevărat/fals
- **Compunere** → `0.3*Truth + 0.5*Truth = 0.8*Truth`
- **Robustețe** → zgomotul nu distruge informația
- **Explicabilitate** → fiecare pas e o instrucțiune DSL reluabilă

### 3. Arhitectura Stratificată

```
Natural Language ↔ LLM Translation
        ↓                ↑
    SpockDSL Script → DSL Output
        ↓                ↑
  Geometric Operations → Vectors
```

Separarea permite:
- Debugging la nivel de DSL (human-readable)
- Evaluare deterministă
- Integrare cu LLM-uri pentru traducere

---

## Evaluare și Testare

### Structura Testelor

```
tests/
├── kernel/           # Teste unitare pentru operații primitive
│   ├── vectorSpace.test.js
│   └── primitiveOps.test.js
├── dsl/              # Teste pentru parser și executor
│   ├── tokenizer.test.js
│   ├── parser.test.js
│   └── executor.test.js
├── planning/         # Teste pentru planificare
│   └── planner.test.js
├── theory/           # Teste pentru versionare
│   └── theoryVersioning.test.js
└── run.js            # Orchestrator principal
```

### Eval Suite

```
evalSuite/
├── 01-basic-logic/       # Operații logice de bază
├── 02-transitivity/      # Silogisme și tranzitivitate
├── 03-numeric/           # Cantități și unități
├── 04-physics/           # Raționament fizic
├── 05-planning/          # Planificare liniară
├── 06-causality/         # Lanțuri cauzale
├── 07-puzzle/            # Rezolvare puzzle-uri
├── 08-versioning/        # Branch și merge
├── 09-summarisation/     # Sumarizare/detaliere
└── 10-mixed/             # Scenarii combinate
```

---

## Referințe

- **Vector Symbolic Architectures**: Kanerva, P. (2009). Hyperdimensional Computing
- **Holographic Reduced Representations**: Plate, T. (1995). Holographic Reduced Representations
- **Conceptual Spaces**: Gärdenfors, P. (2000). Conceptual Spaces: The Geometry of Thought
