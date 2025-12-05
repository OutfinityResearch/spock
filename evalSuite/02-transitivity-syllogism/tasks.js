// Transitivity and Syllogism Evaluation Suite
// Tests transitive reasoning chains and classical syllogisms
module.exports = [
  {
    NL_TASK: "Is element 'a' contained within 'b'?",
    DESCRIPTION: "Assert a basic containment relationship between two elements to establish a premise for transitive reasoning.",
    TASK_TYPE: "Learn",
    DSL_TASK: `
		@useTrans _ UseTheory TransitivityTheory
		@result a In b
		@persist1 $result Persist aInB
    `,
    NL_OUTPUT: "Yes, 'a' is contained within 'b'. This fact has been recorded.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useTrans _ UseTheory TransitivityTheory
		@result a In b
		@persist1 $result Persist aInB
    `
  },
  {
    NL_TASK: "Is element 'b' contained within 'c'?",
    DESCRIPTION: "Assert a second containment relationship to form a chain with the first premise.",
    TASK_TYPE: "Learn",
    DSL_TASK: `
		@useTrans _ UseTheory TransitivityTheory
		@result b In c
		@persist2 $result Persist bInC
    `,
    NL_OUTPUT: "Yes, 'b' is contained within 'c'. This fact has been recorded.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useTrans _ UseTheory TransitivityTheory
		@result b In c
		@persist2 $result Persist bInC
    `
  },
  {
    NL_TASK: "Given that 'a' is in 'b' and 'b' is in 'c', is 'a' in 'c'?",
    DESCRIPTION: "Apply transitive reasoning: if a∈b and b∈c, derive whether a∈c follows.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 b In c
		@chain $f1 TransitiveChain $f2
		@target a In c
		@result $chain Prove $target
		@persist3 $result Persist aInC
    `,
    NL_OUTPUT: "Yes, 'a' is in 'c'. Through transitive reasoning: since a∈b and b∈c, it follows that a∈c.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 b In c
		@chain $f1 TransitiveChain $f2
		@target a In c
		@result $chain Prove $target
		@persist3 $result Persist aInC
    `
  },
  {
    NL_TASK: "If 'a' is in 'b', 'b' is in 'c', and 'c' is in 'd', is 'a' in 'd'?",
    DESCRIPTION: "Test a three-step transitive chain to verify reasoning over longer containment sequences.",
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
		@persist4 $result Persist aInD
    `,
    NL_OUTPUT: "Yes, 'a' is in 'd'. The chain a→b→c→d establishes containment through three transitive steps.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 b In c
		@f3 c In d
		@chain1 $f1 TransitiveChain $f2
		@chain2 $chain1 TransitiveChain $f3
		@target a In d
		@result $chain2 Prove $target
		@persist4 $result Persist aInD
    `
  },
  {
    NL_TASK: "All M are P, and all S are M. Are all S also P?",
    DESCRIPTION: "Test the Barbara syllogism (AAA-1): the most fundamental valid syllogistic form.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useTrans _ UseTheory TransitivityTheory
		@major AllM In AllP
		@minor AllS In AllM
		@chain $minor TransitiveChain $major
		@conclusion AllS In AllP
		@result $chain Prove $conclusion
		@persist5 $result Persist barbaraSyllogism
    `,
    NL_OUTPUT: "Yes, all S are P. This is the Barbara syllogism: from 'All M are P' and 'All S are M', we conclude 'All S are P'.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useTrans _ UseTheory TransitivityTheory
		@major AllM In AllP
		@minor AllS In AllM
		@chain $minor TransitiveChain $major
		@conclusion AllS In AllP
		@result $chain Prove $conclusion
		@persist5 $result Persist barbaraSyllogism
    `
  },
  {
    NL_TASK: "If 'x' is in 'y' and 'z' is in 'w', can we conclude that 'x' is in 'w'?",
    DESCRIPTION: "Test that missing links in transitive chains produce low truth scores (no valid path exists).",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useTrans _ UseTheory TransitivityTheory
		@f1 x In y
		@f2 z In w
		@target x In w
		@result $f1 Prove $target
		@persist6 $result Persist missingLink
    `,
    NL_OUTPUT: "No, we cannot conclude that 'x' is in 'w'. There is no transitive path connecting x to w through the given premises.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useTrans _ UseTheory TransitivityTheory
		@f1 x In y
		@f2 z In w
		@target x In w
		@result $f1 Prove $target
		@persist6 $result Persist missingLink
    `
  },
  {
    NL_TASK: "Socrates is a human, and all humans are mortal. Is Socrates mortal?",
    DESCRIPTION: "The classic Socrates syllogism demonstrating categorical reasoning with named individuals.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useTrans _ UseTheory TransitivityTheory
		@f1 Socrates In Humans
		@f2 Humans In Mortals
		@chain $f1 TransitiveChain $f2
		@conclusion Socrates In Mortals
		@result $chain Prove $conclusion
		@persist7 $result Persist socratesMortal
    `,
    NL_OUTPUT: "Yes, Socrates is mortal. Since Socrates belongs to Humans, and Humans belong to Mortals, Socrates must be mortal.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useTrans _ UseTheory TransitivityTheory
		@f1 Socrates In Humans
		@f2 Humans In Mortals
		@chain $f1 TransitiveChain $f2
		@conclusion Socrates In Mortals
		@result $chain Prove $conclusion
		@persist7 $result Persist socratesMortal
    `
  },
  {
    NL_TASK: "Element 'a' is in both 'b' and 'c'. What can we represent about this?",
    DESCRIPTION: "Test branching containment where one element belongs to multiple containers simultaneously.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 a In c
		@result $f1 TransitiveChain $f2
		@persist8 $result Persist aInBothBC
    `,
    NL_OUTPUT: "Element 'a' belongs to both 'b' and 'c'. This represents multiple set memberships for a single element.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useTrans _ UseTheory TransitivityTheory
		@f1 a In b
		@f2 a In c
		@result $f1 TransitiveChain $f2
		@persist8 $result Persist aInBothBC
    `
  },
  {
    NL_TASK: "Given p∈q, q∈r, r∈s, s∈t, is p∈t?",
    DESCRIPTION: "Test a four-step transitive chain to verify the system handles longer reasoning sequences.",
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
		@persist9 $result Persist pInT
    `,
    NL_OUTPUT: "Yes, p∈t. The four-step chain p→q→r→s→t maintains transitivity: p is ultimately contained in t.",
    DSL_OUTPUT: ``,
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
		@persist9 $result Persist pInT
    `
  },
  {
    NL_TASK: "Prove that A∈C follows from A∈B and B∈C, showing the derivation steps.",
    DESCRIPTION: "Generate an explicit proof trace showing each step of the transitive derivation.",
    TASK_TYPE: "Proof",
    DSL_TASK: `
		@useTrans _ UseTheory TransitivityTheory
		@premise1 A In B
		@premise2 B In C
		@chain $premise1 TransitiveChain $premise2
		@goal A In C
		@result $chain Prove $goal
		@persist10 $result Persist proofAInC
    `,
    NL_OUTPUT: "Proof complete: (1) Given A∈B, (2) Given B∈C, (3) By transitivity of ∈: A∈C. QED.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useTrans _ UseTheory TransitivityTheory
		@premise1 A In B
		@premise2 B In C
		@chain $premise1 TransitiveChain $premise2
		@goal A In C
		@result $chain Prove $goal
		@persist10 $result Persist proofAInC
    `
  }
];
