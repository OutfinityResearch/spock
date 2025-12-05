// Reformatted tasks (no .trim, 2-tab indent)
module.exports = [
  {
    NL_TASK: "Assert basic containment: a In b",
    TASK_TYPE: "Learn",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@result a In b
		@persist1 $result Persist AssertbasiccontainmentaInb
		@describe1 $result Describe AssertbasiccontainmentaInb

    `,
    NL_OUTPUT: "Basic containment fact stored",
    DSL_OUTPUT: `

		@persist1 $result Persist AssertbasiccontainmentaInb
		@describe1 $result Describe AssertbasiccontainmentaInb

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@result a In b
		@persist1 $result Persist AssertbasiccontainmentaInb
		@describe1 $result Describe AssertbasiccontainmentaInb

    `
  },
  {
    NL_TASK: "Assert second containment: b In c",
    TASK_TYPE: "Learn",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@result b In c
		@persist2 $result Persist AssertsecondcontainmentbInc
		@describe2 $result Describe AssertsecondcontainmentbInc

    `,
    NL_OUTPUT: "Second containment fact stored",
    DSL_OUTPUT: `

		@persist2 $result Persist AssertsecondcontainmentbInc
		@describe2 $result Describe AssertsecondcontainmentbInc

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@result b In c
		@persist2 $result Persist AssertsecondcontainmentbInc
		@describe2 $result Describe AssertsecondcontainmentbInc

    `
  },
  {
    NL_TASK: "Derive transitive conclusion: a In c",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 b In c
		@chain $f1 TransitiveChain $f2
		@target a In c
		@result $chain Prove $target
		@persist3 $result Persist DerivetransitiveconclusionaInc
		@describe3 $result Describe DerivetransitiveconclusionaInc

    `,
    NL_OUTPUT: "Transitive derivation shows a is in c",
    DSL_OUTPUT: `

		@persist3 $result Persist DerivetransitiveconclusionaInc
		@describe3 $result Describe DerivetransitiveconclusionaInc

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 b In c
		@chain $f1 TransitiveChain $f2
		@target a In c
		@result $chain Prove $target
		@persist3 $result Persist DerivetransitiveconclusionaInc
		@describe3 $result Describe DerivetransitiveconclusionaInc

    `
  },
  {
    NL_TASK: "Longer transitivity chain: a In b, b In c, c In d",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 b In c
		@f3 c In d
		@chain1 $f1 TransitiveChain $f2
		@chain2 $chain1 TransitiveChain $f3
		@target a In d
		@result $chain2 Prove $target
		@persist4 $result Persist LongertransitivitychainaInbbInccInd
		@describe4 $result Describe LongertransitivitychainaInbbInccInd

    `,
    NL_OUTPUT: "Three-step transitivity chain",
    DSL_OUTPUT: `

		@persist4 $result Persist LongertransitivitychainaInbbInccInd
		@describe4 $result Describe LongertransitivitychainaInbbInccInd

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 b In c
		@f3 c In d
		@chain1 $f1 TransitiveChain $f2
		@chain2 $chain1 TransitiveChain $f3
		@target a In d
		@result $chain2 Prove $target
		@persist4 $result Persist LongertransitivitychainaInbbInccInd
		@describe4 $result Describe LongertransitivitychainaInbbInccInd

    `
  },
  {
    NL_TASK: "Barbara syllogism: All M in P, All S in M => All S in P",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@major AllM In AllP
		@minor AllS In AllM
		@chain $minor TransitiveChain $major
		@conclusion AllS In AllP
		@result $chain Prove $conclusion
		@persist5 $result Persist BarbarasyllogismAllMinPAllSinMAllSinP
		@describe5 $result Describe BarbarasyllogismAllMinPAllSinMAllSinP

    `,
    NL_OUTPUT: "Barbara syllogism validated",
    DSL_OUTPUT: `

		@persist5 $result Persist BarbarasyllogismAllMinPAllSinMAllSinP
		@describe5 $result Describe BarbarasyllogismAllMinPAllSinMAllSinP

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@major AllM In AllP
		@minor AllS In AllM
		@chain $minor TransitiveChain $major
		@conclusion AllS In AllP
		@result $chain Prove $conclusion
		@persist5 $result Persist BarbarasyllogismAllMinPAllSinMAllSinP
		@describe5 $result Describe BarbarasyllogismAllMinPAllSinMAllSinP

    `
  },
  {
    NL_TASK: "Missing link shows low truth score",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 x In y
		@f2 z In w
		@target x In w
		@result $f1 Prove $target
		@persist6 $result Persist Missinglinkshowslowtruthscore
		@describe6 $result Describe Missinglinkshowslowtruthscore

    `,
    NL_OUTPUT: "Missing link should show low truth score",
    DSL_OUTPUT: `

		@persist6 $result Persist Missinglinkshowslowtruthscore
		@describe6 $result Describe Missinglinkshowslowtruthscore

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 x In y
		@f2 z In w
		@target x In w
		@result $f1 Prove $target
		@persist6 $result Persist Missinglinkshowslowtruthscore
		@describe6 $result Describe Missinglinkshowslowtruthscore

    `
  },
  {
    NL_TASK: "Socrates in Humans, Humans in Mortals",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 Socrates In Humans
		@f2 Humans In Mortals
		@chain $f1 TransitiveChain $f2
		@conclusion Socrates In Mortals
		@result $chain Prove $conclusion
		@persist7 $result Persist SocratesinHumansHumansinMortals
		@describe7 $result Describe SocratesinHumansHumansinMortals

    `,
    NL_OUTPUT: "Classical syllogism about Socrates",
    DSL_OUTPUT: `

		@persist7 $result Persist SocratesinHumansHumansinMortals
		@describe7 $result Describe SocratesinHumansHumansinMortals

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 Socrates In Humans
		@f2 Humans In Mortals
		@chain $f1 TransitiveChain $f2
		@conclusion Socrates In Mortals
		@result $chain Prove $conclusion
		@persist7 $result Persist SocratesinHumansHumansinMortals
		@describe7 $result Describe SocratesinHumansHumansinMortals

    `
  },
  {
    NL_TASK: "Branching: a In b, a In c",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 a In c
		@result $f1 TransitiveChain $f2
		@persist8 $result Persist BranchingaInbaInc
		@describe8 $result Describe BranchingaInbaInc

    `,
    NL_OUTPUT: "Same element in multiple containers",
    DSL_OUTPUT: `

		@persist8 $result Persist BranchingaInbaInc
		@describe8 $result Describe BranchingaInbaInc

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 a In c
		@result $f1 TransitiveChain $f2
		@persist8 $result Persist BranchingaInbaInc
		@describe8 $result Describe BranchingaInbaInc

    `
  },
  {
    NL_TASK: "Four-step chain test",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 p In q
		@f2 q In r
		@f3 r In s
		@f4 s In t
		@c1 $f1 TransitiveChain $f2
		@c2 $c1 TransitiveChain $f3
		@c3 $c2 TransitiveChain $f4
		@target p In t
		@result $c3 Prove $target
		@persist9 $result Persist Fourstepchaintest
		@describe9 $result Describe Fourstepchaintest

    `,
    NL_OUTPUT: "Long chain maintains transitivity",
    DSL_OUTPUT: `

		@persist9 $result Persist Fourstepchaintest
		@describe9 $result Describe Fourstepchaintest

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@f1 p In q
		@f2 q In r
		@f3 r In s
		@f4 s In t
		@c1 $f1 TransitiveChain $f2
		@c2 $c1 TransitiveChain $f3
		@c3 $c2 TransitiveChain $f4
		@target p In t
		@result $c3 Prove $target
		@persist9 $result Persist Fourstepchaintest
		@describe9 $result Describe Fourstepchaintest

    `
  },
  {
    NL_TASK: "Proof trace generation",
    TASK_TYPE: "Proof",
    DSL_TASK: `

		@useTrans _ UseTheory TransitivityTheory
		@premise1 A In B
		@premise2 B In C
		@chain $premise1 TransitiveChain $premise2
		@goal A In C
		@result $chain Prove $goal
		@persist10 $result Persist Prooftracegeneration
		@describe10 $result Describe Prooftracegeneration

    `,
    NL_OUTPUT: "Proof trace shows derivation steps",
    DSL_OUTPUT: `

		@persist10 $result Persist Prooftracegeneration
		@describe10 $result Describe Prooftracegeneration

    `,
    DSL_TRACE: `

		@useTrans _ UseTheory TransitivityTheory
		@premise1 A In B
		@premise2 B In C
		@chain $premise1 TransitiveChain $premise2
		@goal A In C
		@result $chain Prove $goal
		@persist10 $result Persist Prooftracegeneration
		@describe10 $result Describe Prooftracegeneration

    `
  }
];