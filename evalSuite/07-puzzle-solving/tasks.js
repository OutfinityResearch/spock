// Puzzle Solving Evaluation Suite
// Tests constraint satisfaction, logical puzzles, and deductive reasoning
module.exports = [
  {
    NL_TASK: "If A implies B, and A is true, what is B?",
    DESCRIPTION: "Test modus ponens: from 'A → B' and 'A is true', derive B.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@factA A Is True
		@ruleAB A Implies B
		@evidence $factA And $ruleAB
		@conclusion $evidence Implies B
		@persist1 $conclusion Persist modusPonens
    `,
    NL_OUTPUT: "B must be true. This is modus ponens: if A implies B, and A is true, then B is true.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@factA A Is True
		@ruleAB A Implies B
		@evidence $factA And $ruleAB
		@conclusion $evidence Implies B
		@persist1 $conclusion Persist modusPonens
    `
  },
  {
    NL_TASK: "Red and Blue are mutually exclusive. If an item is Red, can it be Blue?",
    DESCRIPTION: "Test mutual exclusion constraint: if item is Red and Red excludes Blue, item cannot be Blue.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@isRed Item Is Red
		@exclusive Red Excludes Blue
		@combined $isRed And $exclusive
		@notBlue $combined Implies NotBlue
		@persist2 $notBlue Persist mutualExclusion
    `,
    NL_OUTPUT: "No, the item cannot be Blue. Since the item is Red, and Red and Blue are mutually exclusive, the item must not be Blue.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@isRed Item Is Red
		@exclusive Red Excludes Blue
		@combined $isRed And $exclusive
		@notBlue $combined Implies NotBlue
		@persist2 $notBlue Persist mutualExclusion
    `
  },
  {
    NL_TASK: "In a Sudoku, if Cell1 has 5, can its neighbor Cell2 also have 5?",
    DESCRIPTION: "Test Sudoku-like constraint: adjacent cells cannot have the same value.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@cell1has5 Cell1 Is Five
		@neighbor Cell1 Is NeighborOfCell2
		@constraint Five Excludes SameFive
		@rule $cell1has5 And $constraint
		@cell2not5 $rule Implies Cell2NotFive
		@persist3 $cell2not5 Persist sudokuConstraint
    `,
    NL_OUTPUT: "No, Cell2 cannot have 5. In Sudoku, neighboring cells cannot contain the same number, so if Cell1 has 5, Cell2 must have a different value.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@cell1has5 Cell1 Is Five
		@neighbor Cell1 Is NeighborOfCell2
		@constraint Five Excludes SameFive
		@rule $cell1has5 And $constraint
		@cell2not5 $rule Implies Cell2NotFive
		@persist3 $cell2not5 Persist sudokuConstraint
    `
  },
  {
    NL_TASK: "X is A, A excludes B, and Z requires Y which is B. What's the conflict?",
    DESCRIPTION: "Test three-variable constraint satisfaction with conflicting requirements.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@xIsA X Is A
		@yIsB Y Is B
		@constraintXY A Excludes B
		@checkXY $xIsA And $constraintXY
		@zDepends Z Requires $yIsB
		@solution $checkXY And $zDepends
		@persist4 $solution Persist constraintConflict
    `,
    NL_OUTPUT: "There is a conflict: X is A, which excludes B. But Z requires Y, and Y is B. These constraints cannot all be satisfied simultaneously.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@xIsA X Is A
		@yIsB Y Is B
		@constraintXY A Excludes B
		@checkXY $xIsA And $constraintXY
		@zDepends Z Requires $yIsB
		@solution $checkXY And $zDepends
		@persist4 $solution Persist constraintConflict
    `
  },
  {
    NL_TASK: "Knights and Knaves: Person A says 'B is a knight'. If A is a knight, what is B?",
    DESCRIPTION: "Test logical puzzle where knights always tell truth and knaves always lie.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@statement A Is SaysKnight
		@ifKnight A Is Knight
		@knightTruth Knight Implies TruthTeller
		@check1 $ifKnight And $knightTruth
		@bIsKnight $check1 Implies BIsKnight
		@persist5 $bIsKnight Persist knightsKnaves
    `,
    NL_OUTPUT: "If A is a knight, then B is also a knight. Knights always tell the truth, so if A (a knight) says 'B is a knight', B must indeed be a knight.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@statement A Is SaysKnight
		@ifKnight A Is Knight
		@knightTruth Knight Implies TruthTeller
		@check1 $ifKnight And $knightTruth
		@bIsKnight $check1 Implies BIsKnight
		@persist5 $bIsKnight Persist knightsKnaves
    `
  },
  {
    NL_TASK: "Einstein puzzle: The Norwegian lives in the first house, and the Brit lives in the red house. Does the Norwegian live in the red house?",
    DESCRIPTION: "Test Einstein puzzle fragment with nationality and house color constraints.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@clue1 Norwegian Is House1
		@clue2 House1 Is LeftOfHouse2
		@clue3 Brit Is RedHouse
		@combined $clue1 And $clue2
		@withBrit $combined And $clue3
		@deduction $withBrit Implies NorwegianNotRed
		@persist6 $deduction Persist einsteinClue
    `,
    NL_OUTPUT: "No, the Norwegian does not live in the red house. The Brit lives in the red house, and the Norwegian lives in house 1. Since only one person can live in each house, these are different houses.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@clue1 Norwegian Is House1
		@clue2 House1 Is LeftOfHouse2
		@clue3 Brit Is RedHouse
		@combined $clue1 And $clue2
		@withBrit $combined And $clue3
		@deduction $withBrit Implies NorwegianNotRed
		@persist6 $deduction Persist einsteinClue
    `
  },
  {
    NL_TASK: "River crossing: Can the wolf be left alone with the sheep?",
    DESCRIPTION: "Test river crossing puzzle constraint: wolf cannot be with sheep without farmer.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@wolfSheep Wolf Is WithSheep
		@noFarmer Farmer Is OtherSide
		@danger $wolfSheep And $noFarmer
		@constraint $danger Excludes Safe
		@mustAvoid $constraint Implies AvoidThisState
		@persist7 $mustAvoid Persist riverCrossing
    `,
    NL_OUTPUT: "No, the wolf cannot be left alone with the sheep. Without the farmer present, the wolf will eat the sheep. This state must be avoided.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@wolfSheep Wolf Is WithSheep
		@noFarmer Farmer Is OtherSide
		@danger $wolfSheep And $noFarmer
		@constraint $danger Excludes Safe
		@mustAvoid $constraint Implies AvoidThisState
		@persist7 $mustAvoid Persist riverCrossing
    `
  },
  {
    NL_TASK: "Graph coloring: Node1 is Red. Can adjacent Node2 also be Red?",
    DESCRIPTION: "Test graph coloring constraint: adjacent nodes must have different colors.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@node1Red Node1 Is Red
		@adjacent Node1 Is AdjacentToNode2
		@colorRule Red Excludes SameRed
		@applied $node1Red And $adjacent
		@constraint $applied And $colorRule
		@node2NotRed $constraint Implies Node2NotRed
		@persist8 $node2NotRed Persist graphColoring
    `,
    NL_OUTPUT: "No, Node2 cannot be Red. In graph coloring, adjacent nodes must have different colors. Since Node1 is Red and Node2 is adjacent to Node1, Node2 must be a different color.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@node1Red Node1 Is Red
		@adjacent Node1 Is AdjacentToNode2
		@colorRule Red Excludes SameRed
		@applied $node1Red And $adjacent
		@constraint $applied And $colorRule
		@node2NotRed $constraint Implies Node2NotRed
		@persist8 $node2NotRed Persist graphColoring
    `
  },
  {
    NL_TASK: "Meeting A is before B, and B is before C. What is the order?",
    DESCRIPTION: "Test scheduling with transitive ordering constraints.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@aBeforeB MeetingA Is BeforeMeetingB
		@bBeforeC MeetingB Is BeforeMeetingC
		@transitive $aBeforeB And $bBeforeC
		@aBeforeC $transitive Implies ABeforeC
		@order $aBeforeC And $bBeforeC
		@persist9 $order Persist meetingOrder
    `,
    NL_OUTPUT: "The meeting order is: A, then B, then C. From A < B and B < C, we can derive A < B < C by transitivity.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@aBeforeB MeetingA Is BeforeMeetingB
		@bBeforeC MeetingB Is BeforeMeetingC
		@transitive $aBeforeB And $bBeforeC
		@aBeforeC $transitive Implies ABeforeC
		@order $aBeforeC And $bBeforeC
		@persist9 $order Persist meetingOrder
    `
  },
  {
    NL_TASK: "V1 is A, A requires B, B excludes C, but V2 requires C. Can this be satisfied?",
    DESCRIPTION: "Test complex constraint propagation with chained dependencies and conflicts.",
    TASK_TYPE: "Solve",
    DSL_TASK: `
		@c1 V1 Is A
		@c2 A Requires B
		@c3 B Excludes C
		@c4 V2 Requires C
		@step1 $c1 And $c2
		@step2 $step1 Implies V1NeedsB
		@step3 $step2 And $c3
		@step4 $step3 Implies BExcludesC
		@final $step4 And $c4
		@persist10 $final Persist constraintPropagation
    `,
    NL_OUTPUT: "No, this cannot be satisfied. V1 is A, which requires B. But B excludes C. However, V2 requires C. Since B and C are mutually exclusive, V1 and V2's requirements conflict.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@c1 V1 Is A
		@c2 A Requires B
		@c3 B Excludes C
		@c4 V2 Requires C
		@step1 $c1 And $c2
		@step2 $step1 Implies V1NeedsB
		@step3 $step2 And $c3
		@step4 $step3 Implies BExcludesC
		@final $step4 And $c4
		@persist10 $final Persist constraintPropagation
    `
  }
];
