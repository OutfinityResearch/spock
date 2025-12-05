// Reformatted tasks (no .trim, 2-tab indent)
module.exports = [
  {
    NL_TASK: "Assert that Socrates is Human",
    TASK_TYPE: "Learn",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@result Socrates Is Human
		@persist1 $result Persist AssertthatSocratesisHuman
		@describe1 $result Describe AssertthatSocratesisHuman

    `,
    NL_OUTPUT: "Fact stored",
    DSL_OUTPUT: `

		@persist1 $result Persist AssertthatSocratesisHuman
		@describe1 $result Describe AssertthatSocratesisHuman

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@result Socrates Is Human
		@persist1 $result Persist AssertthatSocratesisHuman
		@describe1 $result Describe AssertthatSocratesisHuman

    `
  },
  {
    NL_TASK: "Assert that Humans are Mortal",
    TASK_TYPE: "Learn",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@result Humans Is Mortal
		@persist2 $result Persist AssertthatHumansareMortal
		@describe2 $result Describe AssertthatHumansareMortal

    `,
    NL_OUTPUT: "Fact stored",
    DSL_OUTPUT: `

		@persist2 $result Persist AssertthatHumansareMortal
		@describe2 $result Describe AssertthatHumansareMortal

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@result Humans Is Mortal
		@persist2 $result Persist AssertthatHumansareMortal
		@describe2 $result Describe AssertthatHumansareMortal

    `
  },
  {
    NL_TASK: "Combine two premises using And",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@p1 Socrates Is Human
		@p2 Humans Is Mortal
		@result $p1 And $p2
		@persist3 $result Persist CombinetwopremisesusingAnd
		@describe3 $result Describe CombinetwopremisesusingAnd

    `,
    NL_OUTPUT: "Two premises combined",
    DSL_OUTPUT: `

		@persist3 $result Persist CombinetwopremisesusingAnd
		@describe3 $result Describe CombinetwopremisesusingAnd

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@p1 Socrates Is Human
		@p2 Humans Is Mortal
		@result $p1 And $p2
		@persist3 $result Persist CombinetwopremisesusingAnd
		@describe3 $result Describe CombinetwopremisesusingAnd

    `
  },
  {
    NL_TASK: "Check implication from premises to conclusion",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@p1 Socrates Is Human
		@p2 Humans Is Mortal
		@premise $p1 And $p2
		@conclusion Socrates Is Mortal
		@result $premise Implies $conclusion
		@persist4 $result Persist Checkimplicationfrompremisestoconclusion
		@describe4 $result Describe Checkimplicationfrompremisestoconclusion

    `,
    NL_OUTPUT: "Implication evaluated with high truth score",
    DSL_OUTPUT: `

		@persist4 $result Persist Checkimplicationfrompremisestoconclusion
		@describe4 $result Describe Checkimplicationfrompremisestoconclusion

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@p1 Socrates Is Human
		@p2 Humans Is Mortal
		@premise $p1 And $p2
		@conclusion Socrates Is Mortal
		@result $premise Implies $conclusion
		@persist4 $result Persist Checkimplicationfrompremisestoconclusion
		@describe4 $result Describe Checkimplicationfrompremisestoconclusion

    `
  },
  {
    NL_TASK: "Test logical negation",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@fact A Is B
		@result $fact Not $fact
		@persist5 $result Persist Testlogicalnegation
		@describe5 $result Describe Testlogicalnegation

    `,
    NL_OUTPUT: "Negation flips the vector",
    DSL_OUTPUT: `

		@persist5 $result Persist Testlogicalnegation
		@describe5 $result Describe Testlogicalnegation

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@fact A Is B
		@result $fact Not $fact
		@persist5 $result Persist Testlogicalnegation
		@describe5 $result Describe Testlogicalnegation

    `
  },
  {
    NL_TASK: "Test logical Or between two facts",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@f1 Cat Is Animal
		@f2 Dog Is Animal
		@result $f1 Or $f2
		@persist6 $result Persist TestlogicalOrbetweentwofacts
		@describe6 $result Describe TestlogicalOrbetweentwofacts

    `,
    NL_OUTPUT: "Disjunction combines facts",
    DSL_OUTPUT: `

		@persist6 $result Persist TestlogicalOrbetweentwofacts
		@describe6 $result Describe TestlogicalOrbetweentwofacts

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@f1 Cat Is Animal
		@f2 Dog Is Animal
		@result $f1 Or $f2
		@persist6 $result Persist TestlogicalOrbetweentwofacts
		@describe6 $result Describe TestlogicalOrbetweentwofacts

    `
  },
  {
    NL_TASK: "Measure distance between similar concepts",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@f1 Bird Is Animal
		@f2 Eagle Is Bird
		@result $f1 Distance $f2
		@persist7 $result Persist Measuredistancebetweensimilarconcepts
		@describe7 $result Describe Measuredistancebetweensimilarconcepts

    `,
    NL_OUTPUT: "Distance computed",
    DSL_OUTPUT: `

		@persist7 $result Persist Measuredistancebetweensimilarconcepts
		@describe7 $result Describe Measuredistancebetweensimilarconcepts

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@f1 Bird Is Animal
		@f2 Eagle Is Bird
		@result $f1 Distance $f2
		@persist7 $result Persist Measuredistancebetweensimilarconcepts
		@describe7 $result Describe Measuredistancebetweensimilarconcepts

    `
  },
  {
    NL_TASK: "Test chained reasoning",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@a X Is Y
		@b Y Is Z
		@c Z Is W
		@chain1 $a And $b
		@chain2 $chain1 And $c
		@target X Is W
		@result $chain2 Implies $target
		@persist8 $result Persist Testchainedreasoning
		@describe8 $result Describe Testchainedreasoning

    `,
    NL_OUTPUT: "Chained reasoning",
    DSL_OUTPUT: `

		@persist8 $result Persist Testchainedreasoning
		@describe8 $result Describe Testchainedreasoning

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@a X Is Y
		@b Y Is Z
		@c Z Is W
		@chain1 $a And $b
		@chain2 $chain1 And $c
		@target X Is W
		@result $chain2 Implies $target
		@persist8 $result Persist Testchainedreasoning
		@describe8 $result Describe Testchainedreasoning

    `
  },
  {
    NL_TASK: "Test contradiction",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@positive A Is B
		@negative $positive Not $positive
		@result $positive And $negative
		@persist9 $result Persist Testcontradiction
		@describe9 $result Describe Testcontradiction

    `,
    NL_OUTPUT: "Contradiction near zero",
    DSL_OUTPUT: `

		@persist9 $result Persist Testcontradiction
		@describe9 $result Describe Testcontradiction

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@positive A Is B
		@negative $positive Not $positive
		@result $positive And $negative
		@persist9 $result Persist Testcontradiction
		@describe9 $result Describe Testcontradiction

    `
  },
  {
    NL_TASK: "Multiple evidence accumulation",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useLogic _ UseTheory BasicLogic
		@f1 Apple Is Fruit
		@f2 Banana Is Fruit
		@f3 Orange Is Fruit
		@evidence $f1 And $f2
		@allFruits $evidence And $f3
		@query Citrus Is Fruit
		@result $allFruits Distance $query
		@persist10 $result Persist Multipleevidenceaccumulation
		@describe10 $result Describe Multipleevidenceaccumulation

    `,
    NL_OUTPUT: "Truth degree computed",
    DSL_OUTPUT: `

		@persist10 $result Persist Multipleevidenceaccumulation
		@describe10 $result Describe Multipleevidenceaccumulation

    `,
    DSL_TRACE: `

		@useLogic _ UseTheory BasicLogic
		@f1 Apple Is Fruit
		@f2 Banana Is Fruit
		@f3 Orange Is Fruit
		@evidence $f1 And $f2
		@allFruits $evidence And $f3
		@query Citrus Is Fruit
		@result $allFruits Distance $query
		@persist10 $result Persist Multipleevidenceaccumulation
		@describe10 $result Describe Multipleevidenceaccumulation

    `
  }
];