// Explanation and Causality Evaluation Suite
// Tests causal reasoning, explanation chains, and cause-effect relationships
module.exports = [
  {
    NL_TASK: "Why is the ground wet?",
    DESCRIPTION: "Test simple causal explanation: rain causes wet ground.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@rain Weather Causes Rain
		@wet $rain Causes WetGround
		@explanation $wet Explains WetGround
		@persist1 $explanation Persist wetGroundExplanation
    `,
    NL_OUTPUT: "The ground is wet because it rained. Rain causes the ground to become wet.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@rain Weather Causes Rain
		@wet $rain Causes WetGround
		@explanation $wet Explains WetGround
		@persist1 $explanation Persist wetGroundExplanation
    `
  },
  {
    NL_TASK: "How do clouds form?",
    DESCRIPTION: "Test multi-step causal chain: sun → heat → evaporation → clouds.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@sun Sun Causes Heat
		@heat $sun LeadsTo Evaporation
		@evap $heat LeadsTo WaterVapor
		@clouds $evap LeadsTo CloudFormation
		@explanation $clouds Explains WhyCloudsForm
		@persist2 $explanation Persist cloudFormationExplanation
    `,
    NL_OUTPUT: "Clouds form through a chain of events: the sun causes heat, heat causes evaporation, water vapor rises and condenses into clouds.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@sun Sun Causes Heat
		@heat $sun LeadsTo Evaporation
		@evap $heat LeadsTo WaterVapor
		@clouds $evap LeadsTo CloudFormation
		@explanation $clouds Explains WhyCloudsForm
		@persist2 $explanation Persist cloudFormationExplanation
    `
  },
  {
    NL_TASK: "Why did the patient recover?",
    DESCRIPTION: "Test medical causal reasoning: virus → symptoms → diagnosis → treatment → recovery.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@infection Virus Causes Infection
		@symptoms $infection LeadsTo Fever
		@diagnosis $symptoms Because $infection
		@treatment $diagnosis LeadsTo Medication
		@recovery $treatment LeadsTo Recovery
		@explanation $recovery Explains WhyRecovered
		@persist3 $explanation Persist recoveryExplanation
    `,
    NL_OUTPUT: "The patient recovered because: the virus caused an infection with fever, this was diagnosed, medication was prescribed, and treatment led to recovery.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@infection Virus Causes Infection
		@symptoms $infection LeadsTo Fever
		@diagnosis $symptoms Because $infection
		@treatment $diagnosis LeadsTo Medication
		@recovery $treatment LeadsTo Recovery
		@explanation $recovery Explains WhyRecovered
		@persist3 $explanation Persist recoveryExplanation
    `
  },
  {
    NL_TASK: "Why do markets reach equilibrium?",
    DESCRIPTION: "Test economic causal reasoning: demand → price → supply → equilibrium.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@demand HighDemand Causes PriceIncrease
		@profit $demand LeadsTo HigherProfit
		@incentive $profit Causes MoreProduction
		@supply $incentive LeadsTo IncreasedSupply
		@balance $supply ChainedCause $demand
		@explanation $balance Explains MarketEquilibrium
		@persist4 $explanation Persist marketExplanation
    `,
    NL_OUTPUT: "Markets reach equilibrium through a feedback loop: high demand raises prices, higher prices increase profits, profits incentivize more production, and increased supply eventually balances demand.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@demand HighDemand Causes PriceIncrease
		@profit $demand LeadsTo HigherProfit
		@incentive $profit Causes MoreProduction
		@supply $incentive LeadsTo IncreasedSupply
		@balance $supply ChainedCause $demand
		@explanation $balance Explains MarketEquilibrium
		@persist4 $explanation Persist marketExplanation
    `
  },
  {
    NL_TASK: "What caused the car accident?",
    DESCRIPTION: "Test multiple contributing causes: speeding AND rain combined caused the accident.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@speed Speeding Causes ReducedControl
		@weather Rain Causes SlipperyRoad
		@combined $speed Add $weather
		@accident $combined LeadsTo Collision
		@explanation $accident Because $combined
		@persist5 $explanation Persist accidentExplanation
    `,
    NL_OUTPUT: "The accident was caused by two factors: speeding reduced vehicle control, and rain made the road slippery. Together, these combined causes led to the collision.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@speed Speeding Causes ReducedControl
		@weather Rain Causes SlipperyRoad
		@combined $speed Add $weather
		@accident $combined LeadsTo Collision
		@explanation $accident Because $combined
		@persist5 $explanation Persist accidentExplanation
    `
  },
  {
    NL_TASK: "Why didn't the person get sick?",
    DESCRIPTION: "Test preventive causation: vaccine prevents infection.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@exposure Pathogen Causes Infection
		@vaccine Vaccination Prevents $exposure
		@healthy $vaccine LeadsTo Immunity
		@explanation $healthy Explains NoInfection
		@persist6 $explanation Persist preventionExplanation
    `,
    NL_OUTPUT: "The person didn't get sick because vaccination prevented infection. The vaccine created immunity, blocking the pathogen's ability to cause disease.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@exposure Pathogen Causes Infection
		@vaccine Vaccination Prevents $exposure
		@healthy $vaccine LeadsTo Immunity
		@explanation $healthy Explains NoInfection
		@persist6 $explanation Persist preventionExplanation
    `
  },
  {
    NL_TASK: "Why are there refugees?",
    DESCRIPTION: "Test historical causal chain: war → destruction → famine → migration.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@war War Causes Destruction
		@crops $war LeadsTo CropFailure
		@famine $crops Causes Famine
		@migration $famine LeadsTo MassExodus
		@chain $migration ChainedCause $war
		@explanation $chain Explains RefugeeCrisis
		@persist7 $explanation Persist refugeeExplanation
    `,
    NL_OUTPUT: "The refugee crisis can be traced back to war: war caused destruction, which led to crop failure, causing famine, which drove mass migration.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@war War Causes Destruction
		@crops $war LeadsTo CropFailure
		@famine $crops Causes Famine
		@migration $famine LeadsTo MassExodus
		@chain $migration ChainedCause $war
		@explanation $chain Explains RefugeeCrisis
		@persist7 $explanation Persist refugeeExplanation
    `
  },
  {
    NL_TASK: "Why are coastal cities flooding?",
    DESCRIPTION: "Test environmental causal chain: emissions → pollution → warming → ice melt → flooding.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@pollution Emissions Causes Pollution
		@warming $pollution LeadsTo GlobalWarming
		@iceMelt $warming LeadsTo IceMelting
		@seaRise $iceMelt LeadsTo SeaLevelRise
		@flooding $seaRise Causes CoastalFlooding
		@explanation $flooding ChainedCause $pollution
		@persist8 $explanation Persist floodingExplanation
    `,
    NL_OUTPUT: "Coastal cities are flooding due to a chain starting with emissions: emissions cause pollution, pollution leads to global warming, warming melts ice, and rising sea levels cause coastal flooding.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@pollution Emissions Causes Pollution
		@warming $pollution LeadsTo GlobalWarming
		@iceMelt $warming LeadsTo IceMelting
		@seaRise $iceMelt LeadsTo SeaLevelRise
		@flooding $seaRise Causes CoastalFlooding
		@explanation $flooding ChainedCause $pollution
		@persist8 $explanation Persist floodingExplanation
    `
  },
  {
    NL_TASK: "Why is there a bug in production?",
    DESCRIPTION: "Test software debugging explanation: typo → compile issue → no testing → bug in prod.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@typo CodeTypo Causes SyntaxError
		@noCompile $typo LeadsTo CompileFail
		@noTest $noCompile Prevents Testing
		@bug $noTest LeadsTo BugInProd
		@explanation $bug Because $typo
		@persist9 $explanation Persist bugExplanation
    `,
    NL_OUTPUT: "The bug is in production because: a code typo caused a syntax error, which led to compile failure, which prevented proper testing, allowing the bug to reach production.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@typo CodeTypo Causes SyntaxError
		@noCompile $typo LeadsTo CompileFail
		@noTest $noCompile Prevents Testing
		@bug $noTest LeadsTo BugInProd
		@explanation $bug Because $typo
		@persist9 $explanation Persist bugExplanation
    `
  },
  {
    NL_TASK: "What explains this complex outcome with multiple contributing factors?",
    DESCRIPTION: "Test complex multi-branch causality with three independent causes combining.",
    TASK_TYPE: "Explain",
    DSL_TASK: `
		@cause1 Factor1 Causes Effect1
		@cause2 Factor2 Causes Effect2
		@cause3 Factor3 Causes Effect3
		@combined $cause1 Add $cause2
		@allCauses $combined Add $cause3
		@finalEffect $allCauses ChainedCause Outcome
		@sub1 $finalEffect Because $cause1
		@sub2 $finalEffect Because $cause2
		@full $finalEffect Explains ComplexOutcome
		@persist10 $full Persist complexExplanation
    `,
    NL_OUTPUT: "The complex outcome is explained by three contributing factors: Factor1, Factor2, and Factor3 each caused separate effects, and their combination led to the final outcome.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@cause1 Factor1 Causes Effect1
		@cause2 Factor2 Causes Effect2
		@cause3 Factor3 Causes Effect3
		@combined $cause1 Add $cause2
		@allCauses $combined Add $cause3
		@finalEffect $allCauses ChainedCause Outcome
		@sub1 $finalEffect Because $cause1
		@sub2 $finalEffect Because $cause2
		@full $finalEffect Explains ComplexOutcome
		@persist10 $full Persist complexExplanation
    `
  }
];
