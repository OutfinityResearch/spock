// Reformatted tasks (no .trim, 2-tab indent)
module.exports = [
  {
    NL_TASK: "Sum two distances with the same unit",
    TASK_TYPE: "Learn",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@d1 5 HasNumericValue 5
		@d1m $d1 AttachUnit m
		@d2 7 HasNumericValue 7
		@d2m $d2 AttachUnit m
		@result $d1m AddNumeric $d2m
		@persist1 $result Persist Sumtwodistanceswiththesameunit
		@describe1 $result Describe Sumtwodistanceswiththesameunit

    `,
    NL_OUTPUT: "Stores a total distance of 12 m",
    DSL_OUTPUT: `

		@persist1 $result Persist Sumtwodistanceswiththesameunit
		@describe1 $result Describe Sumtwodistanceswiththesameunit

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@d1 5 HasNumericValue 5
		@d1m $d1 AttachUnit m
		@d2 7 HasNumericValue 7
		@d2m $d2 AttachUnit m
		@result $d1m AddNumeric $d2m
		@persist1 $result Persist Sumtwodistanceswiththesameunit
		@describe1 $result Describe Sumtwodistanceswiththesameunit

    `
  },
  {
    NL_TASK: "Compute speed from distance and time",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@distLiteral 10 HasNumericValue 10
		@dist $distLiteral AttachUnit m
		@timeLiteral 2 HasNumericValue 2
		@time $timeLiteral AttachUnit s
		@result $dist ComputeSpeed $time
		@persist2 $result Persist Computespeedfromdistanceandtime
		@describe2 $result Describe Computespeedfromdistanceandtime

    `,
    NL_OUTPUT: "Speed computed as 5 m_per_s",
    DSL_OUTPUT: `

		@persist2 $result Persist Computespeedfromdistanceandtime
		@describe2 $result Describe Computespeedfromdistanceandtime

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@distLiteral 10 HasNumericValue 10
		@dist $distLiteral AttachUnit m
		@timeLiteral 2 HasNumericValue 2
		@time $timeLiteral AttachUnit s
		@result $dist ComputeSpeed $time
		@persist2 $result Persist Computespeedfromdistanceandtime
		@describe2 $result Describe Computespeedfromdistanceandtime

    `
  },
  {
    NL_TASK: "Compute force using mass and gravity",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@massLiteral 10 HasNumericValue 10
		@mass $massLiteral AttachUnit kg
		@gLiteral 9.8 HasNumericValue 9.8
		@g $gLiteral AttachUnit m_per_s2
		@forceRaw $mass ComputeForce $g
		@result $forceRaw AttachUnit N
		@persist3 $result Persist Computeforceusingmassandgravity
		@describe3 $result Describe Computeforceusingmassandgravity

    `,
    NL_OUTPUT: "Force calculated as ~98 N",
    DSL_OUTPUT: `

		@persist3 $result Persist Computeforceusingmassandgravity
		@describe3 $result Describe Computeforceusingmassandgravity

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@massLiteral 10 HasNumericValue 10
		@mass $massLiteral AttachUnit kg
		@gLiteral 9.8 HasNumericValue 9.8
		@g $gLiteral AttachUnit m_per_s2
		@forceRaw $mass ComputeForce $g
		@result $forceRaw AttachUnit N
		@persist3 $result Persist Computeforceusingmassandgravity
		@describe3 $result Describe Computeforceusingmassandgravity

    `
  },
  {
    NL_TASK: "Average two measurements",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@m1 4 HasNumericValue 4
		@m2 6 HasNumericValue 6
		@result $m1 Average $m2
		@persist4 $result Persist Averagetwomeasurements
		@describe4 $result Describe Averagetwomeasurements

    `,
    NL_OUTPUT: "Average is 5",
    DSL_OUTPUT: `

		@persist4 $result Persist Averagetwomeasurements
		@describe4 $result Describe Averagetwomeasurements

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@m1 4 HasNumericValue 4
		@m2 6 HasNumericValue 6
		@result $m1 Average $m2
		@persist4 $result Persist Averagetwomeasurements
		@describe4 $result Describe Averagetwomeasurements

    `
  },
  {
    NL_TASK: "Attach a numeric reading to a concept",
    TASK_TYPE: "Learn",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@massLiteral 5 HasNumericValue 5
		@mass $massLiteral AttachUnit kg
		@result $mass AttachToConcept Block
		@persist5 $result Persist Attachanumericreadingtoaconcept
		@describe5 $result Describe Attachanumericreadingtoaconcept

    `,
    NL_OUTPUT: "Mass of Block recorded as 5 kg",
    DSL_OUTPUT: `

		@persist5 $result Persist Attachanumericreadingtoaconcept
		@describe5 $result Describe Attachanumericreadingtoaconcept

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@massLiteral 5 HasNumericValue 5
		@mass $massLiteral AttachUnit kg
		@result $mass AttachToConcept Block
		@persist5 $result Persist Attachanumericreadingtoaconcept
		@describe5 $result Describe Attachanumericreadingtoaconcept

    `
  },
  {
    NL_TASK: "Divide distance by time to get acceleration",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@speedLiteral 20 HasNumericValue 20
		@speed $speedLiteral AttachUnit m_per_s
		@timeLiteral 5 HasNumericValue 5
		@time $timeLiteral AttachUnit s
		@result $speed DivNumeric $time
		@persist6 $result Persist Dividedistancebytimetogetacceleration
		@describe6 $result Describe Dividedistancebytimetogetacceleration

    `,
    NL_OUTPUT: "Acceleration computed as 4 m_per_s2",
    DSL_OUTPUT: `

		@persist6 $result Persist Dividedistancebytimetogetacceleration
		@describe6 $result Describe Dividedistancebytimetogetacceleration

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@speedLiteral 20 HasNumericValue 20
		@speed $speedLiteral AttachUnit m_per_s
		@timeLiteral 5 HasNumericValue 5
		@time $timeLiteral AttachUnit s
		@result $speed DivNumeric $time
		@persist6 $result Persist Dividedistancebytimetogetacceleration
		@describe6 $result Describe Dividedistancebytimetogetacceleration

    `
  },
  {
    NL_TASK: "Multiply numbers with composed units",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@forceLiteral 50 HasNumericValue 50
		@force $forceLiteral AttachUnit N
		@distanceLiteral 3 HasNumericValue 3
		@distance $distanceLiteral AttachUnit m
		@result $force MulNumeric $distance
		@persist7 $result Persist Multiplynumberswithcomposedunits
		@describe7 $result Describe Multiplynumberswithcomposedunits

    `,
    NL_OUTPUT: "Energy computed with unit composition",
    DSL_OUTPUT: `

		@persist7 $result Persist Multiplynumberswithcomposedunits
		@describe7 $result Describe Multiplynumberswithcomposedunits

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@forceLiteral 50 HasNumericValue 50
		@force $forceLiteral AttachUnit N
		@distanceLiteral 3 HasNumericValue 3
		@distance $distanceLiteral AttachUnit m
		@result $force MulNumeric $distance
		@persist7 $result Persist Multiplynumberswithcomposedunits
		@describe7 $result Describe Multiplynumberswithcomposedunits

    `
  },
  {
    NL_TASK: "Subtract two temperatures (unit compatible)",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@t1 30 HasNumericValue 30
		@t1c $t1 AttachUnit C
		@t2 20 HasNumericValue 20
		@t2c $t2 AttachUnit C
		@result $t1c SubNumeric $t2c
		@persist8 $result Persist Subtracttwotemperaturesunitcompatible
		@describe8 $result Describe Subtracttwotemperaturesunitcompatible

    `,
    NL_OUTPUT: "Temperature difference computed",
    DSL_OUTPUT: `

		@persist8 $result Persist Subtracttwotemperaturesunitcompatible
		@describe8 $result Describe Subtracttwotemperaturesunitcompatible

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@t1 30 HasNumericValue 30
		@t1c $t1 AttachUnit C
		@t2 20 HasNumericValue 20
		@t2c $t2 AttachUnit C
		@result $t1c SubNumeric $t2c
		@persist8 $result Persist Subtracttwotemperaturesunitcompatible
		@describe8 $result Describe Subtracttwotemperaturesunitcompatible

    `
  },
  {
    NL_TASK: "Project numeric from measured concept",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@speedLiteral 12 HasNumericValue 12
		@speed $speedLiteral AttachUnit m_per_s
		@result $speed ProjectNumeric $speed
		@persist9 $result Persist Projectnumericfrommeasuredconcept
		@describe9 $result Describe Projectnumericfrommeasuredconcept

    `,
    NL_OUTPUT: "Projected numeric retains value",
    DSL_OUTPUT: `

		@persist9 $result Persist Projectnumericfrommeasuredconcept
		@describe9 $result Describe Projectnumericfrommeasuredconcept

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@speedLiteral 12 HasNumericValue 12
		@speed $speedLiteral AttachUnit m_per_s
		@result $speed ProjectNumeric $speed
		@persist9 $result Persist Projectnumericfrommeasuredconcept
		@describe9 $result Describe Projectnumericfrommeasuredconcept

    `
  },
  {
    NL_TASK: "Handle zero and negative values",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@useNumeric _ UseTheory NumericExamples
		@zero 0 HasNumericValue 0
		@neg -5 HasNumericValue -5
		@sum $zero AddNumeric $neg
		@result $sum AttachUnit unitless
		@persist10 $result Persist Handlezeroandnegativevalues
		@describe10 $result Describe Handlezeroandnegativevalues

    `,
    NL_OUTPUT: "Supports zero and negative numeric values",
    DSL_OUTPUT: `

		@persist10 $result Persist Handlezeroandnegativevalues
		@describe10 $result Describe Handlezeroandnegativevalues

    `,
    DSL_TRACE: `

		@useNumeric _ UseTheory NumericExamples
		@zero 0 HasNumericValue 0
		@neg -5 HasNumericValue -5
		@sum $zero AddNumeric $neg
		@result $sum AttachUnit unitless
		@persist10 $result Persist Handlezeroandnegativevalues
		@describe10 $result Describe Handlezeroandnegativevalues

    `
  }
];