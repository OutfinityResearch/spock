// Reformatted tasks (no .trim, 2-tab indent)
module.exports = [
  {
    NL_TASK: "Logic puzzle: If A then B, A is true, what is B?",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@factA A Is True
		@ruleAB A Implies B
		@evidence @factA And @ruleAB
		@conclusion @evidence Implies B
		@persist1 $evidence Persist LogicpuzzleIfAthenBAistruewhatisB
		@describe1 $evidence Describe LogicpuzzleIfAthenBAistruewhatisB

    `,
    NL_OUTPUT: "B must be true by modus ponens",
    DSL_OUTPUT: `

		@persist1 $evidence Persist LogicpuzzleIfAthenBAistruewhatisB
		@describe1 $evidence Describe LogicpuzzleIfAthenBAistruewhatisB

    `,
    DSL_TRACE: `

		@factA A Is True
		@ruleAB A Implies B
		@evidence @factA And @ruleAB
		@conclusion @evidence Implies B
		@persist1 $evidence Persist LogicpuzzleIfAthenBAistruewhatisB
		@describe1 $evidence Describe LogicpuzzleIfAthenBAistruewhatisB

    `
  },
  {
    NL_TASK: "Constraint: Red and Blue are mutually exclusive, item is Red",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@isRed Item Is Red
		@exclusive Red Excludes Blue
		@combined @isRed And @exclusive
		@notBlue @combined Implies NotBlue
		@persist2 $combined Persist ConstraintRedandBluearemutuallyexclusiveitemisRed
		@describe2 $combined Describe ConstraintRedandBluearemutuallyexclusiveitemisRed

    `,
    NL_OUTPUT: "Item cannot be Blue if it's Red",
    DSL_OUTPUT: `

		@persist2 $combined Persist ConstraintRedandBluearemutuallyexclusiveitemisRed
		@describe2 $combined Describe ConstraintRedandBluearemutuallyexclusiveitemisRed

    `,
    DSL_TRACE: `

		@isRed Item Is Red
		@exclusive Red Excludes Blue
		@combined @isRed And @exclusive
		@notBlue @combined Implies NotBlue
		@persist2 $combined Persist ConstraintRedandBluearemutuallyexclusiveitemisRed
		@describe2 $combined Describe ConstraintRedandBluearemutuallyexclusiveitemisRed

    `
  },
  {
    NL_TASK: "Sudoku-like: if cell has 5, neighbor cannot have 5",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@cell1has5 Cell1 Is Five
		@neighbor Cell1 Is NeighborOfCell2
		@constraint Five Excludes SameFive
		@rule @cell1has5 And @constraint
		@cell2not5 @rule Implies Cell2NotFive
		@persist3 $rule Persist Sudokulikeifcellhas5neighborcannothave5
		@describe3 $rule Describe Sudokulikeifcellhas5neighborcannothave5

    `,
    NL_OUTPUT: "Neighbor cell cannot have 5",
    DSL_OUTPUT: `

		@persist3 $rule Persist Sudokulikeifcellhas5neighborcannothave5
		@describe3 $rule Describe Sudokulikeifcellhas5neighborcannothave5

    `,
    DSL_TRACE: `

		@cell1has5 Cell1 Is Five
		@neighbor Cell1 Is NeighborOfCell2
		@constraint Five Excludes SameFive
		@rule @cell1has5 And @constraint
		@cell2not5 @rule Implies Cell2NotFive
		@persist3 $rule Persist Sudokulikeifcellhas5neighborcannothave5
		@describe3 $rule Describe Sudokulikeifcellhas5neighborcannothave5

    `
  },
  {
    NL_TASK: "Three-variable constraint satisfaction",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@xIsA X Is A
		@yIsB Y Is B
		@constraintXY A Excludes B
		@checkXY @xIsA And @constraintXY
		@zDepends Z Requires @yIsB
		@solution @checkXY And @zDepends
		@persist4 $zDepends Persist Threevariableconstraintsatisfaction
		@describe4 $zDepends Describe Threevariableconstraintsatisfaction

    `,
    NL_OUTPUT: "Find consistent assignment for X, Y, Z",
    DSL_OUTPUT: `

		@persist4 $zDepends Persist Threevariableconstraintsatisfaction
		@describe4 $zDepends Describe Threevariableconstraintsatisfaction

    `,
    DSL_TRACE: `

		@xIsA X Is A
		@yIsB Y Is B
		@constraintXY A Excludes B
		@checkXY @xIsA And @constraintXY
		@zDepends Z Requires @yIsB
		@solution @checkXY And @zDepends
		@persist4 $zDepends Persist Threevariableconstraintsatisfaction
		@describe4 $zDepends Describe Threevariableconstraintsatisfaction

    `
  },
  {
    NL_TASK: "Knights and Knaves: A says B is a knight",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@statement A Is SaysKnight
		@ifKnight A Is Knight
		@knightTruth Knight Implies TruthTeller
		@check1 @ifKnight And @knightTruth
		@bIsKnight @check1 Implies BIsKnight
		@persist5 $check1 Persist KnightsandKnavesAsaysBisaknight
		@describe5 $check1 Describe KnightsandKnavesAsaysBisaknight

    `,
    NL_OUTPUT: "If A is knight, B is knight",
    DSL_OUTPUT: `

		@persist5 $check1 Persist KnightsandKnavesAsaysBisaknight
		@describe5 $check1 Describe KnightsandKnavesAsaysBisaknight

    `,
    DSL_TRACE: `

		@statement A Is SaysKnight
		@ifKnight A Is Knight
		@knightTruth Knight Implies TruthTeller
		@check1 @ifKnight And @knightTruth
		@bIsKnight @check1 Implies BIsKnight
		@persist5 $check1 Persist KnightsandKnavesAsaysBisaknight
		@describe5 $check1 Describe KnightsandKnavesAsaysBisaknight

    `
  },
  {
    NL_TASK: "Einstein puzzle fragment: Norwegian lives in first house",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@clue1 Norwegian Is House1
		@clue2 House1 Is LeftOfHouse2
		@clue3 Brit Is RedHouse
		@combined @clue1 And @clue2
		@withBrit @combined And @clue3
		@deduction @withBrit Implies NorwegianNotRed
		@persist6 $withBrit Persist EinsteinpuzzlefragmentNorwegianlivesinfirsthouse
		@describe6 $withBrit Describe EinsteinpuzzlefragmentNorwegianlivesinfirsthouse

    `,
    NL_OUTPUT: "Norwegian doesn't live in red house",
    DSL_OUTPUT: `

		@persist6 $withBrit Persist EinsteinpuzzlefragmentNorwegianlivesinfirsthouse
		@describe6 $withBrit Describe EinsteinpuzzlefragmentNorwegianlivesinfirsthouse

    `,
    DSL_TRACE: `

		@clue1 Norwegian Is House1
		@clue2 House1 Is LeftOfHouse2
		@clue3 Brit Is RedHouse
		@combined @clue1 And @clue2
		@withBrit @combined And @clue3
		@deduction @withBrit Implies NorwegianNotRed
		@persist6 $withBrit Persist EinsteinpuzzlefragmentNorwegianlivesinfirsthouse
		@describe6 $withBrit Describe EinsteinpuzzlefragmentNorwegianlivesinfirsthouse

    `
  },
  {
    NL_TASK: "River crossing: Wolf cannot be with sheep alone",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@wolfSheep Wolf Is WithSheep
		@noFarmer Farmer Is OtherSide
		@danger @wolfSheep And @noFarmer
		@constraint @danger Excludes Safe
		@mustAvoid @constraint Implies AvoidThisState
		@persist7 $constraint Persist RivercrossingWolfcannotbewithsheepalone
		@describe7 $constraint Describe RivercrossingWolfcannotbewithsheepalone

    `,
    NL_OUTPUT: "Cannot leave wolf with sheep",
    DSL_OUTPUT: `

		@persist7 $constraint Persist RivercrossingWolfcannotbewithsheepalone
		@describe7 $constraint Describe RivercrossingWolfcannotbewithsheepalone

    `,
    DSL_TRACE: `

		@wolfSheep Wolf Is WithSheep
		@noFarmer Farmer Is OtherSide
		@danger @wolfSheep And @noFarmer
		@constraint @danger Excludes Safe
		@mustAvoid @constraint Implies AvoidThisState
		@persist7 $constraint Persist RivercrossingWolfcannotbewithsheepalone
		@describe7 $constraint Describe RivercrossingWolfcannotbewithsheepalone

    `
  },
  {
    NL_TASK: "Graph coloring: Adjacent nodes different colors",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@node1Red Node1 Is Red
		@adjacent Node1 Is AdjacentToNode2
		@colorRule Red Excludes SameRed
		@applied @node1Red And @adjacent
		@constraint @applied And @colorRule
		@node2NotRed @constraint Implies Node2NotRed
		@persist8 $constraint Persist GraphcoloringAdjacentnodesdifferentcolors
		@describe8 $constraint Describe GraphcoloringAdjacentnodesdifferentcolors

    `,
    NL_OUTPUT: "Adjacent node must be different color",
    DSL_OUTPUT: `

		@persist8 $constraint Persist GraphcoloringAdjacentnodesdifferentcolors
		@describe8 $constraint Describe GraphcoloringAdjacentnodesdifferentcolors

    `,
    DSL_TRACE: `

		@node1Red Node1 Is Red
		@adjacent Node1 Is AdjacentToNode2
		@colorRule Red Excludes SameRed
		@applied @node1Red And @adjacent
		@constraint @applied And @colorRule
		@node2NotRed @constraint Implies Node2NotRed
		@persist8 $constraint Persist GraphcoloringAdjacentnodesdifferentcolors
		@describe8 $constraint Describe GraphcoloringAdjacentnodesdifferentcolors

    `
  },
  {
    NL_TASK: "Scheduling: Meeting A before B, B before C",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@aBeforeB MeetingA Is BeforeMeetingB
		@bBeforeC MeetingB Is BeforeMeetingC
		@transitive @aBeforeB And @bBeforeC
		@aBeforeC @transitive Implies ABeforeC
		@order @aBeforeC And @bBeforeC
		@persist9 $bBeforeC Persist SchedulingMeetingAbeforeBBbeforeC
		@describe9 $bBeforeC Describe SchedulingMeetingAbeforeBBbeforeC

    `,
    NL_OUTPUT: "Order: A < B < C",
    DSL_OUTPUT: `

		@persist9 $bBeforeC Persist SchedulingMeetingAbeforeBBbeforeC
		@describe9 $bBeforeC Describe SchedulingMeetingAbeforeBBbeforeC

    `,
    DSL_TRACE: `

		@aBeforeB MeetingA Is BeforeMeetingB
		@bBeforeC MeetingB Is BeforeMeetingC
		@transitive @aBeforeB And @bBeforeC
		@aBeforeC @transitive Implies ABeforeC
		@order @aBeforeC And @bBeforeC
		@persist9 $bBeforeC Persist SchedulingMeetingAbeforeBBbeforeC
		@describe9 $bBeforeC Describe SchedulingMeetingAbeforeBBbeforeC

    `
  },
  {
    NL_TASK: "Complex constraint propagation",
    TASK_TYPE: "Solve",
    DSL_TASK: `

		@c1 V1 Is A
		@c2 A Requires B
		@c3 B Excludes C
		@c4 V2 Requires C
		@step1 @c1 And @c2
		@step2 @step1 Implies V1NeedsB
		@step3 @step2 And @c3
		@step4 @step3 Implies BExcludesC
		@final @step4 And @c4
		@persist10 $c4 Persist Complexconstraintpropagation
		@describe10 $c4 Describe Complexconstraintpropagation

    `,
    NL_OUTPUT: "V1 needs B which excludes C but V2 needs C",
    DSL_OUTPUT: `

		@persist10 $c4 Persist Complexconstraintpropagation
		@describe10 $c4 Describe Complexconstraintpropagation

    `,
    DSL_TRACE: `

		@c1 V1 Is A
		@c2 A Requires B
		@c3 B Excludes C
		@c4 V2 Requires C
		@step1 @c1 And @c2
		@step2 @step1 Implies V1NeedsB
		@step3 @step2 And @c3
		@step4 @step3 Implies BExcludesC
		@final @step4 And @c4
		@persist10 $c4 Persist Complexconstraintpropagation
		@describe10 $c4 Describe Complexconstraintpropagation

    `
  }
];