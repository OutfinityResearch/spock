// Numeric Quantities Evaluation Suite
// Tests numeric operations, unit handling, and physical calculations
module.exports = [
  {
    NL_TASK: "What is 5 meters plus 7 meters?",
    DESCRIPTION: "Test addition of two numeric values with the same unit (meters).",
    TASK_TYPE: "Learn",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@d1 5 HasNumericValue 5
		@d1m $d1 AttachUnit m
		@d2 7 HasNumericValue 7
		@d2m $d2 AttachUnit m
		@result $d1m AddNumeric $d2m
		@persist1 $result Persist totalDistance
    `,
    NL_OUTPUT: "5 meters plus 7 meters equals 12 meters.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@d1 5 HasNumericValue 5
		@d1m $d1 AttachUnit m
		@d2 7 HasNumericValue 7
		@d2m $d2 AttachUnit m
		@result $d1m AddNumeric $d2m
		@persist1 $result Persist totalDistance
    `
  },
  {
    NL_TASK: "If I travel 10 meters in 2 seconds, what is my speed?",
    DESCRIPTION: "Test speed calculation by dividing distance by time with proper unit derivation.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@distLiteral 10 HasNumericValue 10
		@dist $distLiteral AttachUnit m
		@timeLiteral 2 HasNumericValue 2
		@time $timeLiteral AttachUnit s
		@result $dist ComputeSpeed $time
		@persist2 $result Persist speed
    `,
    NL_OUTPUT: "Your speed is 5 meters per second (5 m/s).",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@distLiteral 10 HasNumericValue 10
		@dist $distLiteral AttachUnit m
		@timeLiteral 2 HasNumericValue 2
		@time $timeLiteral AttachUnit s
		@result $dist ComputeSpeed $time
		@persist2 $result Persist speed
    `
  },
  {
    NL_TASK: "What force is needed to accelerate a 10 kg mass at 9.8 m/s²?",
    DESCRIPTION: "Test force calculation using F = m × a with unit composition.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@massLiteral 10 HasNumericValue 10
		@mass $massLiteral AttachUnit kg
		@gLiteral 9.8 HasNumericValue 9.8
		@g $gLiteral AttachUnit m_per_s2
		@forceRaw $mass ComputeForce $g
		@result $forceRaw AttachUnit N
		@persist3 $result Persist force
    `,
    NL_OUTPUT: "The force required is 98 Newtons (N = kg × m/s²).",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@massLiteral 10 HasNumericValue 10
		@mass $massLiteral AttachUnit kg
		@gLiteral 9.8 HasNumericValue 9.8
		@g $gLiteral AttachUnit m_per_s2
		@forceRaw $mass ComputeForce $g
		@result $forceRaw AttachUnit N
		@persist3 $result Persist force
    `
  },
  {
    NL_TASK: "What is the average of 4 and 6?",
    DESCRIPTION: "Test averaging two numeric measurements.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@m1 4 HasNumericValue 4
		@m2 6 HasNumericValue 6
		@result $m1 Average $m2
		@persist4 $result Persist average
    `,
    NL_OUTPUT: "The average of 4 and 6 is 5.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@m1 4 HasNumericValue 4
		@m2 6 HasNumericValue 6
		@result $m1 Average $m2
		@persist4 $result Persist average
    `
  },
  {
    NL_TASK: "A block has a mass of 5 kg. Record this measurement.",
    DESCRIPTION: "Test attaching a numeric value with unit to a named concept.",
    TASK_TYPE: "Learn",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@massLiteral 5 HasNumericValue 5
		@mass $massLiteral AttachUnit kg
		@result $mass AttachToConcept Block
		@persist5 $result Persist blockMass
    `,
    NL_OUTPUT: "Recorded: The block has a mass of 5 kg.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@massLiteral 5 HasNumericValue 5
		@mass $massLiteral AttachUnit kg
		@result $mass AttachToConcept Block
		@persist5 $result Persist blockMass
    `
  },
  {
    NL_TASK: "If speed is 20 m/s and time is 5 s, what is the acceleration?",
    DESCRIPTION: "Test acceleration calculation by dividing velocity by time.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@speedLiteral 20 HasNumericValue 20
		@speed $speedLiteral AttachUnit m_per_s
		@timeLiteral 5 HasNumericValue 5
		@time $timeLiteral AttachUnit s
		@result $speed DivNumeric $time
		@persist6 $result Persist acceleration
    `,
    NL_OUTPUT: "The acceleration is 4 m/s² (meters per second squared).",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@speedLiteral 20 HasNumericValue 20
		@speed $speedLiteral AttachUnit m_per_s
		@timeLiteral 5 HasNumericValue 5
		@time $timeLiteral AttachUnit s
		@result $speed DivNumeric $time
		@persist6 $result Persist acceleration
    `
  },
  {
    NL_TASK: "What is the work done when applying 50 N of force over 3 meters?",
    DESCRIPTION: "Test energy/work calculation: W = F × d with unit composition (N × m = J).",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@forceLiteral 50 HasNumericValue 50
		@force $forceLiteral AttachUnit N
		@distanceLiteral 3 HasNumericValue 3
		@distance $distanceLiteral AttachUnit m
		@result $force MulNumeric $distance
		@persist7 $result Persist work
    `,
    NL_OUTPUT: "The work done is 150 Joules (N × m = J).",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@forceLiteral 50 HasNumericValue 50
		@force $forceLiteral AttachUnit N
		@distanceLiteral 3 HasNumericValue 3
		@distance $distanceLiteral AttachUnit m
		@result $force MulNumeric $distance
		@persist7 $result Persist work
    `
  },
  {
    NL_TASK: "What is the temperature difference between 30°C and 20°C?",
    DESCRIPTION: "Test subtraction of compatible unit values (temperature difference).",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@t1 30 HasNumericValue 30
		@t1c $t1 AttachUnit C
		@t2 20 HasNumericValue 20
		@t2c $t2 AttachUnit C
		@result $t1c SubNumeric $t2c
		@persist8 $result Persist tempDiff
    `,
    NL_OUTPUT: "The temperature difference is 10°C.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@t1 30 HasNumericValue 30
		@t1c $t1 AttachUnit C
		@t2 20 HasNumericValue 20
		@t2c $t2 AttachUnit C
		@result $t1c SubNumeric $t2c
		@persist8 $result Persist tempDiff
    `
  },
  {
    NL_TASK: "Extract the numeric value from a speed measurement of 12 m/s.",
    DESCRIPTION: "Test projecting a numeric value from a measured concept.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@speedLiteral 12 HasNumericValue 12
		@speed $speedLiteral AttachUnit m_per_s
		@result $speed ProjectNumeric $speed
		@persist9 $result Persist numericValue
    `,
    NL_OUTPUT: "The numeric value is 12 (from the measurement 12 m/s).",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@speedLiteral 12 HasNumericValue 12
		@speed $speedLiteral AttachUnit m_per_s
		@result $speed ProjectNumeric $speed
		@persist9 $result Persist numericValue
    `
  },
  {
    NL_TASK: "What is zero plus negative five?",
    DESCRIPTION: "Test handling of zero and negative numeric values.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@useNumeric _ UseTheory NumericExamples
		@zero 0 HasNumericValue 0
		@neg -5 HasNumericValue -5
		@sum $zero AddNumeric $neg
		@result $sum AttachUnit unitless
		@persist10 $result Persist sumResult
    `,
    NL_OUTPUT: "Zero plus negative five equals -5.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@useNumeric _ UseTheory NumericExamples
		@zero 0 HasNumericValue 0
		@neg -5 HasNumericValue -5
		@sum $zero AddNumeric $neg
		@result $sum AttachUnit unitless
		@persist10 $result Persist sumResult
    `
  }
];
