# Fundamentele Teoretice ale Spock

## Introducere

Spock este un **Sistem Operațional Geometric (GOS)** pentru raționament neuro-simbolic. Acest document explică teoria matematică care stă la baza sistemului și de ce funcționează.

---

## 1. Spații Hiperdimensionale și Proprietățile lor

### 1.1 Blestemul și Binecuvântarea Dimensionalității

În mod contraintuitiv, spațiile de înaltă dimensionalitate au proprietăți care le fac ideale pentru reprezentarea cunoștințelor:

**Teorema Concentrării Măsurii:**
> În spații de dimensionalitate înaltă, aproape toată masa unei distribuții este concentrată într-o coroană subțire la distanță √d de origine.

**Implicații pentru Spock:**
- Vectorii aleatori au norme aproape identice: ‖v‖ ≈ √d
- Normalizarea e stabilă numeric
- Volumul e "la suprafață", nu în interior

### 1.2 Quasi-Ortogonalitatea Vectorilor Aleatori

**Teoremă (Johnson-Lindenstrauss simplificată):**
> Dacă v₁, v₂ sunt vectori aleatori independenți în ℝᵈ cu componente din N(0, 1/d), atunci:
>
> E[⟨v₁, v₂⟩] = 0
> Var[⟨v₁, v₂⟩] = 1/d

Pentru d = 512:
- Deviația standard a produsului scalar: σ ≈ 0.044
- Probabilitatea ca |⟨v₁, v₂⟩| > 0.2: P < 0.00003

**De ce contează:**
- Putem genera concepte noi fără coordonare globală
- Coliziunile sunt practic imposibile
- Sistemul e robust la zgomot

### 1.3 Scalarea Gaussiană

Spock folosește distribuția N(0, 1/√d) pentru generarea vectorilor:

```javascript
const scale = 1 / Math.sqrt(d);
for (let i = 0; i < d; i++) {
    vec[i] = gaussianRandom() * scale;
}
```

Aceasta asigură că vectorii au norma așteptată ≈ 1, ceea ce simplifică normalizarea și menține stabilitatea numerică.

---

## 2. Vector Symbolic Architectures (VSA)

### 2.1 Originile

VSA combină idei din:
- **Holografia** (Gabor, 1948): informația distribuită în tot mediul
- **Memoria asociativă** (Hopfield, 1982): recuperare prin similaritate
- **Calculul neuronal** (McCulloch & Pitts): operații simple, emergență complexă

### 2.2 Operațiile Fundamentale

VSA definește trei operații care sunt **invertibile** sau **pseudo-invertibile**:

#### Bundling (Superpoziție)
```
bundle(A, B) = A + B
```

**Proprietăți:**
- Comutativă: A + B = B + A
- Asociativă: (A + B) + C = A + (B + C)
- Rezultatul e similar cu toți operanzii
- **Semantică:** "Setul care conține A și B"

**În Spock:** Implementat ca `Add(a, b)`

#### Binding (Legare)
```
bind(A, B) = A ⊙ B  (produs Hadamard)
```

**Proprietăți:**
- Comutativă: A ⊙ B = B ⊙ A
- Auto-inversă: A ⊙ A = 1 (pentru vectori bipolari)
- Rezultatul e disimilar cu operanzii
- **Semantică:** "Relația dintre A și B"

**În Spock:** Implementat ca `Bind(a, b)`

#### Permutation (Nu folosită direct)
```
permute(A, π) = Aπ
```

**Proprietăți:**
- Inversă: permute(Aπ, π⁻¹) = A
- Disimilar cu originalul
- **Semantică:** "Ordine/Secvență"

**În Spock:** Ar putea fi adăugată pentru reprezentarea ordinii temporale.

### 2.3 Reprezentări Compoziționale

VSA permite construirea de structuri complexe:

```
"câine roșu" = bind(câine, atribut) + bind(roșu, valoare)
            = (câine ⊙ atribut) + (roșu ⊙ valoare)
```

**Recuperare:**
```
query = "ce culoare?"
answer = memory ⊙ valoare  // Extrage roșu
```

---

## 3. Geometria Adevărului

### 3.1 Adevărul ca Direcție

Ideea centrală a lui Spock:

> **Adevărul nu este o valoare binară, ci o direcție în spațiu.**

Definim un vector canonic `Truth` generat aleator la inițializarea motorului:

```javascript
const Truth = normalise(createRandomVector(dim));
const False = negate(Truth);  // -Truth
const Zero = createVector(dim);  // vectorul zero
```

### 3.2 Proiecția pe Axa Adevărului

Pentru orice propoziție P reprezentată ca vector vₚ:

```
truth_degree(P) = cos(vₚ, Truth) = ⟨vₚ, Truth⟩ / (‖vₚ‖ · ‖Truth‖)
```

**Interpretare geometrică:**

```
        Truth
          ↑
          │
          │╲ θ = arccos(0.8)
          │ ╲
          │  ╲
          │   ● vₚ (80% adevărat)
          │
          │
    ──────┼──────→
          │
          │
          │
          ↓
        False
```

### 3.3 Adevăruri Parțiale și Compunere

**Adevăr parțial:**
```
0.7 * Truth = vector cu 70% aliniere la Truth
```

**Compunerea evidenței:**
```
evid1 = 0.3 * Truth
evid2 = 0.4 * Truth
combined = evid1 + evid2 = 0.7 * Truth
```

Aceasta modelează **acumularea bayesiană** a evidenței!

### 3.4 Avantajele Modelului Geometric

1. **Continuitate**: Nu există salt discret true→false
2. **Incertitudine**: Vectorii ortogonali pe Truth = necunoscut
3. **Compunere**: Adunarea e naturală și comutativă
4. **Robusteț**: Zgomotul nu distruge informația calitativă

---

## 4. Raționamentul ca Navigare

### 4.1 Semantic Gradient Descent

Raționamentul în Spock e **navigare prin spațiul conceptual**:

```
Problemă: Ajunge din starea S la starea G
Soluție: Găsește secvența de acțiuni A₁, A₂, ... care minimizează
         distanța angular la G
```

**Algoritm:**

```
current = S
while distance(current, G) > ε:
    best_action = argmax_{a ∈ Actions} similarity(apply(a, current), G)
    current = apply(best_action, current)
    plan.append(best_action)
return plan
```

### 4.2 Homotopia și Continuitatea

O proprietate cheie: **transformările sunt continue (homotopice)**.

**Definiție informală:**
> Două căi sunt homotopice dacă una poate fi deformată continuu în cealaltă.

**De ce contează:**
- Nu există "salturi" în raționament
- Calea de la premisă la concluzie e trasabilă
- Interpolarea între concepte e naturală

### 4.3 Platouri și Escape

Uneori algoritmul greedy se blochează într-un **platou** (minim local):

```
similarity(apply(any_action, current), G) ≤ similarity(current, G)
```

**Strategii de escape:**

1. **Fail**: Returnează eșec (pentru probleme imposibile)
2. **Random Restart**: Perturbație aleatoare, speră să scape
3. **Procedural Fallback**: Cheamă solver extern (JavaScript)

---

## 5. Teorii și Spații Locale

### 5.1 Teoriile ca Subspații

O teorie T definește un **subspațiu** al spațiului conceptual:

```
T = span{concept₁, concept₂, ..., verbᵢ, ...}
```

**Overlay-ul** unei teorii = reuniunea bazelor:

```
Session = T₁ ∪ T₂ ∪ ... ∪ LocalSymbols
```

### 5.2 Rezoluția Simbolurilor

Ordinea de căutare (LIFO pentru overlays):

```
1. Local symbols (@declarations din sesiune)
2. Overlay N (cel mai recent UseTheory)
3. Overlay N-1
4. ...
5. Overlay 1
6. Global symbols (Truth, False, Zero)
7. Auto-generate (vector aleator nou)
```

### 5.3 Merge ca Operație Geometrică

Strategia **consensus** pentru merge:

```
merged_vector = normalise(target_vector + source_vector)
```

**Interpretare geometrică:** Vectorul rezultat e la "jumătatea drumului" (pe sfera unitate) între cele două versiuni.

```
         ● Target
        /│
       / │
      /  │
     /   │
    ●────┼────● Merged (pe bisectoare, normalizat)
     \   │
      \  │
       \ │
        \│
         ● Source
```

---

## 6. Sistemul de Tipuri și Polimorfism

### 6.1 Tipuri Runtime

Spock folosește **boxed values** cu type tags:

```javascript
{
    type: 'VECTOR',
    value: Float32Array([...]),
    symbolName: 'Concept1'
}
```

### 6.2 Polimorfismul lui Modulate

`Modulate` e polimorfic pe tipul celui de-al doilea operand:

```javascript
function modulate(v, operand) {
    if (typeof operand === 'number') {
        return scale(v, operand);      // Scalar mode
    } else {
        return hadamard(v, operand);   // Vector mode (gating)
    }
}
```

**De ce contează:**
- Scalar mode: `Modulate(Truth, 0.8)` = 80% adevăr
- Vector mode: `Modulate(info, attention)` = focus selectiv

---

## 7. Explicabilitate și Determinism

### 7.1 Principiul DSL-In/DSL-Out

Orice operație Spock:
1. Primește un script DSL
2. Returnează un script DSL echivalent

Aceasta permite:
- **Replayability**: Orice rezultat poate fi reprodus
- **Debugging**: Fiecare pas e human-readable
- **Evaluation**: Comparație exactă DSL_OUTPUT vs DSL_EXPECTED

### 7.2 Seed-uri pentru Reproducibilitate

```javascript
vectorSpace.setRandomSeed(42);  // Același seed = aceiași vectori
```

Cu un seed fix:
- Auto-generarea conceptelor e deterministă
- Testele sunt repetabile
- Evaluarea e obiectivă

---

## 8. Conexiuni cu Alte Domenii

### 8.1 Embedding-uri din NLP

Word2Vec, GloVe, BERT toate produc vectori pentru cuvinte. Spock extinde ideea:
- Nu doar cuvinte, ci **concepte** și **relații**
- Nu doar similaritate, ci **operații** (bind, add, negate)
- Nu doar lookup, ci **raționament** (plan, solve)

### 8.2 Conceptual Spaces (Gärdenfors)

Peter Gärdenfors a propus că conceptele sunt **regiuni convexe** în spații multi-dimensionale:
- Dimensiunile = proprietăți (culoare, formă, mărime)
- Conceptele = prototipuri + toleranță

Spock implementează o versiune computabilă a acestei teorii.

### 8.3 Holographic Reduced Representations (Plate)

Tony Plate a arătat cum să codifici **structuri recursive** în vectori:
- Arbori, grafuri, liste
- Binding = rol-filler
- Bundling = set

Spock moștenește aceste capacități prin operațiile VSA.

---

## 9. Limitări și Direcții Viitoare

### 9.1 Limitări Curente

1. **Interferență**: Prea multe bundling-uri degradează semnalul
2. **Capacitate finită**: ~log(d) elemente distincte per vector
3. **Fără ordine implicită**: Secvențele necesită encoding explicit

### 9.2 Extensii Posibile

1. **Permutation pentru ordine**: A → B → C codificat diferit de C → B → A
2. **Attention mechanisms**: Focus selectiv pe părți din reprezentare
3. **Hierarchical chunking**: Reprezentări la multiple niveluri de abstractizare

---

## 10. Concluzie

Spock funcționează pentru că:

1. **Matematica e solidă**: Quasi-ortogonalitatea și concentrarea măsurii
2. **Semantica e naturală**: Similaritatea = distanță geometrică
3. **Operațiile sunt simple**: Add, Bind, Normalize
4. **Raționamentul e continuu**: Navigare, nu salturi logice
5. **Explicabilitatea e integrată**: DSL-In/DSL-Out

Sistemul combină rigoarea calculului simbolic cu flexibilitatea reprezentărilor distribuite, oferind un fundament solid pentru raționament neuro-simbolic.

---

## Referințe

1. Kanerva, P. (2009). *Hyperdimensional Computing: An Introduction to Computing in Distributed Representation with High-Dimensional Random Vectors*
2. Plate, T. A. (1995). *Holographic Reduced Representations*
3. Gayler, R. W. (2004). *Vector Symbolic Architectures Answer Jackendoff's Challenges for Cognitive Neuroscience*
4. Gärdenfors, P. (2000). *Conceptual Spaces: The Geometry of Thought*
5. Johnson, W. B., & Lindenstrauss, J. (1984). *Extensions of Lipschitz mappings into a Hilbert space*
