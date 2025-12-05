// Reformatted tasks (no .trim, 2-tab indent)
module.exports = [
  {
    NL_TASK: "Simple causal chain: rain causes wet ground",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@rain Weather Causes Rain
		@wet @rain Causes WetGround
		@explanation @wet Explains WetGround
		@persist1 $wet Persist Simplecausalchainraincauseswetground
		@describe1 $wet Describe Simplecausalchainraincauseswetground

    `,
    NL_OUTPUT: "Ground is wet because it rained",
    DSL_OUTPUT: `

		@persist1 $wet Persist Simplecausalchainraincauseswetground
		@describe1 $wet Describe Simplecausalchainraincauseswetground

    `,
    DSL_TRACE: `

		@rain Weather Causes Rain
		@wet @rain Causes WetGround
		@explanation @wet Explains WetGround
		@persist1 $wet Persist Simplecausalchainraincauseswetground
		@describe1 $wet Describe Simplecausalchainraincauseswetground

    `
  },
  {
    NL_TASK: "Three-step causal chain: sun -> heat -> evaporation -> clouds",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@sun Sun Causes Heat
		@heat @sun LeadsTo Evaporation
		@evap @heat LeadsTo WaterVapor
		@clouds @evap LeadsTo CloudFormation
		@explanation @clouds Explains WhyCloudsForm
		@persist2 $clouds Persist Threestepcausalchainsunheatevaporationclouds
		@describe2 $clouds Describe Threestepcausalchainsunheatevaporationclouds

    `,
    NL_OUTPUT: "Clouds form due to chain: sun -> heat -> evaporation",
    DSL_OUTPUT: `

		@persist2 $clouds Persist Threestepcausalchainsunheatevaporationclouds
		@describe2 $clouds Describe Threestepcausalchainsunheatevaporationclouds

    `,
    DSL_TRACE: `

		@sun Sun Causes Heat
		@heat @sun LeadsTo Evaporation
		@evap @heat LeadsTo WaterVapor
		@clouds @evap LeadsTo CloudFormation
		@explanation @clouds Explains WhyCloudsForm
		@persist2 $clouds Persist Threestepcausalchainsunheatevaporationclouds
		@describe2 $clouds Describe Threestepcausalchainsunheatevaporationclouds

    `
  },
  {
    NL_TASK: "Medical reasoning: virus causes symptoms causes treatment",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@infection Virus Causes Infection
		@symptoms @infection LeadsTo Fever
		@diagnosis @symptoms Because @infection
		@treatment @diagnosis LeadsTo Medication
		@recovery @treatment LeadsTo Recovery
		@explanation @recovery Explains WhyRecovered
		@persist3 $recovery Persist Medicalreasoningviruscausessymptomscausestreatment
		@describe3 $recovery Describe Medicalreasoningviruscausessymptomscausestreatment

    `,
    NL_OUTPUT: "Recovery explained by treatment chain",
    DSL_OUTPUT: `

		@persist3 $recovery Persist Medicalreasoningviruscausessymptomscausestreatment
		@describe3 $recovery Describe Medicalreasoningviruscausessymptomscausestreatment

    `,
    DSL_TRACE: `

		@infection Virus Causes Infection
		@symptoms @infection LeadsTo Fever
		@diagnosis @symptoms Because @infection
		@treatment @diagnosis LeadsTo Medication
		@recovery @treatment LeadsTo Recovery
		@explanation @recovery Explains WhyRecovered
		@persist3 $recovery Persist Medicalreasoningviruscausessymptomscausestreatment
		@describe3 $recovery Describe Medicalreasoningviruscausessymptomscausestreatment

    `
  },
  {
    NL_TASK: "Economic cause-effect: demand -> price -> supply",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@demand HighDemand Causes PriceIncrease
		@profit @demand LeadsTo HigherProfit
		@incentive @profit Causes MoreProduction
		@supply @incentive LeadsTo IncreasedSupply
		@balance @supply ChainedCause @demand
		@explanation @balance Explains MarketEquilibrium
		@persist4 $balance Persist Economiccauseeffectdemandpricesupply
		@describe4 $balance Describe Economiccauseeffectdemandpricesupply

    `,
    NL_OUTPUT: "Market balances through demand-supply chain",
    DSL_OUTPUT: `

		@persist4 $balance Persist Economiccauseeffectdemandpricesupply
		@describe4 $balance Describe Economiccauseeffectdemandpricesupply

    `,
    DSL_TRACE: `

		@demand HighDemand Causes PriceIncrease
		@profit @demand LeadsTo HigherProfit
		@incentive @profit Causes MoreProduction
		@supply @incentive LeadsTo IncreasedSupply
		@balance @supply ChainedCause @demand
		@explanation @balance Explains MarketEquilibrium
		@persist4 $balance Persist Economiccauseeffectdemandpricesupply
		@describe4 $balance Describe Economiccauseeffectdemandpricesupply

    `
  },
  {
    NL_TASK: "Accident investigation: multiple causes",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@speed Speeding Causes ReducedControl
		@weather Rain Causes SlipperyRoad
		@combined @speed Add @weather
		@accident @combined LeadsTo Collision
		@explanation @accident Because @combined
		@persist5 $combined Persist Accidentinvestigationmultiplecauses
		@describe5 $combined Describe Accidentinvestigationmultiplecauses

    `,
    NL_OUTPUT: "Accident caused by speed AND rain",
    DSL_OUTPUT: `

		@persist5 $combined Persist Accidentinvestigationmultiplecauses
		@describe5 $combined Describe Accidentinvestigationmultiplecauses

    `,
    DSL_TRACE: `

		@speed Speeding Causes ReducedControl
		@weather Rain Causes SlipperyRoad
		@combined @speed Add @weather
		@accident @combined LeadsTo Collision
		@explanation @accident Because @combined
		@persist5 $combined Persist Accidentinvestigationmultiplecauses
		@describe5 $combined Describe Accidentinvestigationmultiplecauses

    `
  },
  {
    NL_TASK: "Preventive reasoning: vaccine prevents disease",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@exposure Pathogen Causes Infection
		@vaccine Vaccination Prevents @exposure
		@healthy @vaccine LeadsTo Immunity
		@explanation @healthy Explains NoInfection
		@persist6 $healthy Persist Preventivereasoningvaccinepreventsdisease
		@describe6 $healthy Describe Preventivereasoningvaccinepreventsdisease

    `,
    NL_OUTPUT: "No infection because vaccine prevented it",
    DSL_OUTPUT: `

		@persist6 $healthy Persist Preventivereasoningvaccinepreventsdisease
		@describe6 $healthy Describe Preventivereasoningvaccinepreventsdisease

    `,
    DSL_TRACE: `

		@exposure Pathogen Causes Infection
		@vaccine Vaccination Prevents @exposure
		@healthy @vaccine LeadsTo Immunity
		@explanation @healthy Explains NoInfection
		@persist6 $healthy Persist Preventivereasoningvaccinepreventsdisease
		@describe6 $healthy Describe Preventivereasoningvaccinepreventsdisease

    `
  },
  {
    NL_TASK: "Historical causation: war causes famine causes migration",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@war War Causes Destruction
		@crops @war LeadsTo CropFailure
		@famine @crops Causes Famine
		@migration @famine LeadsTo MassExodus
		@chain @migration ChainedCause @war
		@explanation @chain Explains RefugeeCrisis
		@persist7 $chain Persist Historicalcausationwarcausesfaminecausesmigration
		@describe7 $chain Describe Historicalcausationwarcausesfaminecausesmigration

    `,
    NL_OUTPUT: "Refugee crisis traced back to war",
    DSL_OUTPUT: `

		@persist7 $chain Persist Historicalcausationwarcausesfaminecausesmigration
		@describe7 $chain Describe Historicalcausationwarcausesfaminecausesmigration

    `,
    DSL_TRACE: `

		@war War Causes Destruction
		@crops @war LeadsTo CropFailure
		@famine @crops Causes Famine
		@migration @famine LeadsTo MassExodus
		@chain @migration ChainedCause @war
		@explanation @chain Explains RefugeeCrisis
		@persist7 $chain Persist Historicalcausationwarcausesfaminecausesmigration
		@describe7 $chain Describe Historicalcausationwarcausesfaminecausesmigration

    `
  },
  {
    NL_TASK: "Environmental chain: pollution -> warming -> ice melt -> flooding",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@pollution Emissions Causes Pollution
		@warming @pollution LeadsTo GlobalWarming
		@iceMelt @warming LeadsTo IceMelting
		@seaRise @iceMelt LeadsTo SeaLevelRise
		@flooding @seaRise Causes CoastalFlooding
		@explanation @flooding ChainedCause @pollution
		@persist8 $pollution Persist Environmentalchainpollutionwarmingicemeltflooding
		@describe8 $pollution Describe Environmentalchainpollutionwarmingicemeltflooding

    `,
    NL_OUTPUT: "Flooding traced to emissions through chain",
    DSL_OUTPUT: `

		@persist8 $pollution Persist Environmentalchainpollutionwarmingicemeltflooding
		@describe8 $pollution Describe Environmentalchainpollutionwarmingicemeltflooding

    `,
    DSL_TRACE: `

		@pollution Emissions Causes Pollution
		@warming @pollution LeadsTo GlobalWarming
		@iceMelt @warming LeadsTo IceMelting
		@seaRise @iceMelt LeadsTo SeaLevelRise
		@flooding @seaRise Causes CoastalFlooding
		@explanation @flooding ChainedCause @pollution
		@persist8 $pollution Persist Environmentalchainpollutionwarmingicemeltflooding
		@describe8 $pollution Describe Environmentalchainpollutionwarmingicemeltflooding

    `
  },
  {
    NL_TASK: "Software bug explanation",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@typo CodeTypo Causes SyntaxError
		@noCompile @typo LeadsTo CompileFail
		@noTest @noCompile Prevents Testing
		@bug @noTest LeadsTo BugInProd
		@explanation @bug Because @typo
		@persist9 $typo Persist Softwarebugexplanation
		@describe9 $typo Describe Softwarebugexplanation

    `,
    NL_OUTPUT: "Bug in prod because typo prevented testing",
    DSL_OUTPUT: `

		@persist9 $typo Persist Softwarebugexplanation
		@describe9 $typo Describe Softwarebugexplanation

    `,
    DSL_TRACE: `

		@typo CodeTypo Causes SyntaxError
		@noCompile @typo LeadsTo CompileFail
		@noTest @noCompile Prevents Testing
		@bug @noTest LeadsTo BugInProd
		@explanation @bug Because @typo
		@persist9 $typo Persist Softwarebugexplanation
		@describe9 $typo Describe Softwarebugexplanation

    `
  },
  {
    NL_TASK: "Complex multi-branch causality",
    TASK_TYPE: "Explain",
    DSL_TASK: `

		@cause1 Factor1 Causes Effect1
		@cause2 Factor2 Causes Effect2
		@cause3 Factor3 Causes Effect3
		@combined @cause1 Add @cause2
		@allCauses @combined Add @cause3
		@finalEffect @allCauses ChainedCause Outcome
		@sub1 @finalEffect Because @cause1
		@sub2 @finalEffect Because @cause2
		@full @finalEffect Explains ComplexOutcome
		@persist10 $finalEffect Persist Complexmultibranchcausality
		@describe10 $finalEffect Describe Complexmultibranchcausality

    `,
    NL_OUTPUT: "Complex outcome from multiple factors",
    DSL_OUTPUT: `

		@persist10 $finalEffect Persist Complexmultibranchcausality
		@describe10 $finalEffect Describe Complexmultibranchcausality

    `,
    DSL_TRACE: `

		@cause1 Factor1 Causes Effect1
		@cause2 Factor2 Causes Effect2
		@cause3 Factor3 Causes Effect3
		@combined @cause1 Add @cause2
		@allCauses @combined Add @cause3
		@finalEffect @allCauses ChainedCause Outcome
		@sub1 @finalEffect Because @cause1
		@sub2 @finalEffect Because @cause2
		@full @finalEffect Explains ComplexOutcome
		@persist10 $finalEffect Persist Complexmultibranchcausality
		@describe10 $finalEffect Describe Complexmultibranchcausality

    `
  }
];