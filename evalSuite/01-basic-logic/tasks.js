// Logic suite with explicit Persist/Describe outputs (Describe side-effect only)
module.exports = [
  {
    NL_TASK: "Store fact: Socrates is Human (named SocratesHuman, anchored to Socrates)",
    DESCRIPTION: "Load BasicLogic, create fact Socrates Is Human, link it to concept Socrates, and persist it as SocratesHuman for later use.",
    TASK_TYPE: "Learn",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@fact Socrates Is Human
		@link1 $fact Describe Socrates
		@persist1 $fact Persist SocratesHuman
    `,
    NL_OUTPUT: "Socrates is Human (stored as SocratesHuman, anchored to Socrates).",
    DSL_OUTPUT: `
		@SocratesHuman Socrates Is Human
		@SocratesHumanAnchor SocratesHuman Bind Socrates
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@fact Socrates Is Human
		@link1 $fact Describe Socrates
		@persist1 $fact Persist SocratesHuman
    `
  },
  {
    NL_TASK: "Store fact: Humans are Mortal (named HumansMortal, anchored to Humans)",
    DESCRIPTION: "Load BasicLogic, create fact Humans Is Mortal, link it to concept Humans, and persist it as HumansMortal.",
    TASK_TYPE: "Learn",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@fact Humans Is Mortal
		@link2 $fact Describe Humans
		@persist2 $fact Persist HumansMortal
    `,
    NL_OUTPUT: "Humans are Mortal (stored as HumansMortal, anchored to Humans).",
    DSL_OUTPUT: `
		@HumansMortal Humans Is Mortal
		@HumansMortalAnchor HumansMortal Bind Humans
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@fact Humans Is Mortal
		@link2 $fact Describe Humans
		@persist2 $fact Persist HumansMortal
    `
  },
  {
    NL_TASK: "Combine premises SocratesHuman and HumansMortal into a joint premise pair",
    DESCRIPTION: "Load BasicLogic, recreate the two premises, combine them with And, link to PremisePair, and persist that combined evidence.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@p1 Socrates Is Human
		@p2 Humans Is Mortal
		@combined $p1 And $p2
		@link3 $combined Describe PremisePair
		@persist3 $combined Persist PremisePair
    `,
    NL_OUTPUT: "PremisePair captures both premises (SocratesHuman and HumansMortal).",
    DSL_OUTPUT: `
		@PremisePair SocratesHuman And HumansMortal
		@PremisePairAnchor PremisePair Bind PremisePair
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@p1 Socrates Is Human
		@p2 Humans Is Mortal
		@combined $p1 And $p2
		@link3 $combined Describe PremisePair
		@persist3 $combined Persist PremisePair
    `
  },
  {
    NL_TASK: "Compute implication: (SocratesHuman ∧ HumansMortal) ⇒ SocratesMortal",
    DESCRIPTION: "Load BasicLogic, build premise and conclusion, compute Implies, and persist as ImplicationResult.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@p1 Socrates Is Human
		@p2 Humans Is Mortal
		@premise $p1 And $p2
		@conclusion Socrates Is Mortal
		@imp $premise Implies $conclusion
		@persist4 $imp Persist ImplicationResult
    `,
    NL_OUTPUT: "Implication holds as PremisePair ⇒ SocratesMortal (stored as ImplicationResult).",
    DSL_OUTPUT: `
		@ImplicationResult PremisePair Implies SocratesMortal
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@p1 Socrates Is Human
		@p2 Humans Is Mortal
		@premise $p1 And $p2
		@conclusion Socrates Is Mortal
		@imp $premise Implies $conclusion
		@persist4 $imp Persist ImplicationResult
    `
  },
  {
    NL_TASK: "Negate fact A Is B and persist as NegatedFact",
    DESCRIPTION: "Load BasicLogic, create fact A Is B, negate it, and persist the negated fact.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@fact A Is B
		@neg $fact Not $fact
		@persist5 $neg Persist NegatedFact
    `,
    NL_OUTPUT: "Negated fact of A relative to B (stored as NegatedFact).",
    DSL_OUTPUT: `
		@NegatedFact A Not B
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@fact A Is B
		@neg $fact Not $fact
		@persist5 $neg Persist NegatedFact
    `
  },
  {
    NL_TASK: "Combine Cat Is Animal and Dog Is Animal with Or, persist as PetAnimalEvidence",
    DESCRIPTION: "Load BasicLogic, assert Cat Is Animal and Dog Is Animal, combine with Or, and persist the result.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@f1 Cat Is Animal
		@f2 Dog Is Animal
		@disj $f1 Or $f2
		@persist6 $disj Persist PetAnimalEvidence
    `,
    NL_OUTPUT: "Either Cat or Dog is Animal (disjunction stored as PetAnimalEvidence).",
    DSL_OUTPUT: `
		@PetAnimalEvidence Cat Or Dog
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@f1 Cat Is Animal
		@f2 Dog Is Animal
		@disj $f1 Or $f2
		@persist6 $disj Persist PetAnimalEvidence
    `
  },
  {
    NL_TASK: "Measure similarity between Bird Is Animal and Eagle Is Bird, persist score",
    DESCRIPTION: "Load BasicLogic, assert two facts, compute Distance, and persist the distance as BirdEagleDistance.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@f1 Bird Is Animal
		@f2 Eagle Is Bird
		@dist $f1 Distance $f2
		@persist7 $dist Persist BirdEagleDistance
    `,
    NL_OUTPUT: "Computed the distance between Bird and Eagle (stored as BirdEagleDistance).",
    DSL_OUTPUT: `
		@BirdEagleDistance Bird Distance Eagle
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@f1 Bird Is Animal
		@f2 Eagle Is Bird
		@dist $f1 Distance $f2
		@persist7 $dist Persist BirdEagleDistance
    `
  },
  {
    NL_TASK: "Chain X→Y, Y→Z, Z→W and check implication to X→W",
    DESCRIPTION: "Load BasicLogic, chain three links with And, evaluate Implies against X Is W, and persist as ChainedReasoningResult.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@a X Is Y
		@b Y Is Z
		@c Z Is W
		@chain1 $a And $b
		@chain2 $chain1 And $c
		@target X Is W
		@imp $chain2 Implies $target
		@persist8 $imp Persist ChainedReasoningResult
    `,
    NL_OUTPUT: "Chained implication derives XW (stored as ChainedReasoningResult).",
    DSL_OUTPUT: `
		@ChainedReasoningResult ChainXYZ Implies XW
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@a X Is Y
		@b Y Is Z
		@c Z Is W
		@chain1 $a And $b
		@chain2 $chain1 And $c
		@target X Is W
		@imp $chain2 Implies $target
		@persist8 $imp Persist ChainedReasoningResult
    `
  },
  {
    NL_TASK: "Build contradiction A Is B and its negation, persist combined evidence",
    DESCRIPTION: "Load BasicLogic, assert A Is B, negate it, combine with And, and persist as ContradictionEvidence.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@positive A Is B
		@negative $positive Not $positive
		@combo $positive And $negative
		@persist9 $combo Persist ContradictionEvidence
    `,
    NL_OUTPUT: "Contradiction captured between A Is B and its negation (ContradictionEvidence).",
    DSL_OUTPUT: `
		@ContradictionEvidence A And NegatedFact
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@positive A Is B
		@negative $positive Not $positive
		@combo $positive And $negative
		@persist9 $combo Persist ContradictionEvidence
    `
  },
  {
    NL_TASK: "Aggregate Apple/Banana/Orange as Fruit and score Citrus Is Fruit",
    DESCRIPTION: "Load BasicLogic, accumulate three fruit facts with And, compare to Citrus Is Fruit with Distance, persist score as FruitTruthScore.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useLogic _ UseTheory BasicLogic
		@f1 Apple Is Fruit
		@f2 Banana Is Fruit
		@f3 Orange Is Fruit
		@evidence $f1 And $f2
		@allFruits $evidence And $f3
		@query Citrus Is Fruit
		@score $allFruits Distance $query
		@persist10 $score Persist FruitTruthScore
    `,
    NL_OUTPUT: "Computed truth score that Citrus is Fruit given accumulated fruits (FruitTruthScore).",
    DSL_OUTPUT: `
		@FruitTruthScore AllFruits Distance Citrus
    `,
    DSL_TRACE: `
		@useLogic _ UseTheory BasicLogic
		@f1 Apple Is Fruit
		@f2 Banana Is Fruit
		@f3 Orange Is Fruit
		@evidence $f1 And $f2
		@allFruits $evidence And $f3
		@query Citrus Is Fruit
		@score $allFruits Distance $query
		@persist10 $score Persist FruitTruthScore
    `
  }
];
