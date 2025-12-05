// Reformatted tasks (indent first line, no .trim)
module.exports = [
  {
    NL_TASK: "Mixed logic and causality: rain causes wet, wet implies slippery",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@rain Weather Is Rainy
		@wet @rain Causes WetGround
		@slippery @wet Implies SlipperyRoad
		@danger @slippery And @rain
		@persist1 $rain Persist Mixedlogicandcausalityraincauseswetwetimpliesslippery
		@describe1 $rain Describe Mixedlogicandcausalityraincauseswetwetimpliesslippery
    `,
    NL_OUTPUT: "Chain: rain -> wet -> slippery -> danger",
    DSL_OUTPUT: `
		@persist1 $rain Persist Mixedlogicandcausalityraincauseswetwetimpliesslippery
		@describe1 $rain Describe Mixedlogicandcausalityraincauseswetwetimpliesslippery
    `,
    DSL_TRACE: `
		@rain Weather Is Rainy
		@wet @rain Causes WetGround
		@slippery @wet Implies SlipperyRoad
		@danger @slippery And @rain
		@persist1 $rain Persist Mixedlogicandcausalityraincauseswetwetimpliesslippery
		@describe1 $rain Describe Mixedlogicandcausalityraincauseswetwetimpliesslippery
    `
  },
  {
    NL_TASK: "Planning with constraints: need A before B, but A excludes C",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@needA Task Requires StepA
		@beforeB StepA LeadsTo StepB
		@conflict StepA Excludes StepC
		@plan @needA And @beforeB
		@constrained @plan And @conflict
		@persist2 $conflict Persist PlanningwithconstraintsneedAbeforeBbutAexcludesC
		@describe2 $conflict Describe PlanningwithconstraintsneedAbeforeBbutAexcludesC
    `,
    NL_OUTPUT: "Plan with mutual exclusion constraint",
    DSL_OUTPUT: `
		@persist2 $conflict Persist PlanningwithconstraintsneedAbeforeBbutAexcludesC
		@describe2 $conflict Describe PlanningwithconstraintsneedAbeforeBbutAexcludesC
    `,
    DSL_TRACE: `
		@needA Task Requires StepA
		@beforeB StepA LeadsTo StepB
		@conflict StepA Excludes StepC
		@plan @needA And @beforeB
		@constrained @plan And @conflict
		@persist2 $conflict Persist PlanningwithconstraintsneedAbeforeBbutAexcludesC
		@describe2 $conflict Describe PlanningwithconstraintsneedAbeforeBbutAexcludesC
    `
  },
  {
    NL_TASK: "Budget comparison with logical consequence",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@budget Amount Is LowBudget
		@cost Project Is HighCost
		@overBudget @cost GreaterThan @budget
		@needApproval @overBudget Implies RequiresApproval
		@decision @needApproval And @overBudget
		@persist3 $overBudget Persist Budgetcomparisonwithlogicalconsequence
		@describe3 $overBudget Describe Budgetcomparisonwithlogicalconsequence
    `,
    NL_OUTPUT: "Over budget requires approval",
    DSL_OUTPUT: `
		@persist3 $overBudget Persist Budgetcomparisonwithlogicalconsequence
		@describe3 $overBudget Describe Budgetcomparisonwithlogicalconsequence
    `,
    DSL_TRACE: `
		@budget Amount Is LowBudget
		@cost Project Is HighCost
		@overBudget @cost GreaterThan @budget
		@needApproval @overBudget Implies RequiresApproval
		@decision @needApproval And @overBudget
		@persist3 $overBudget Persist Budgetcomparisonwithlogicalconsequence
		@describe3 $overBudget Describe Budgetcomparisonwithlogicalconsequence
    `
  },
  {
    NL_TASK: "Causal chain with summarization",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@cause1 Factor1 Causes Effect1
		@cause2 Factor2 Causes Effect2
		@combined @cause1 And @cause2
		@chain @combined LeadsTo FinalEffect
		@summary @chain Summarize OverallImpact
		@persist4 $chain Persist Causalchainwithsummarization
		@describe4 $chain Describe Causalchainwithsummarization
    `,
    NL_OUTPUT: "Multiple causes summarized",
    DSL_OUTPUT: `
		@persist4 $chain Persist Causalchainwithsummarization
		@describe4 $chain Describe Causalchainwithsummarization
    `,
    DSL_TRACE: `
		@cause1 Factor1 Causes Effect1
		@cause2 Factor2 Causes Effect2
		@combined @cause1 And @cause2
		@chain @combined LeadsTo FinalEffect
		@summary @chain Summarize OverallImpact
		@persist4 $chain Persist Causalchainwithsummarization
		@describe4 $chain Describe Causalchainwithsummarization
    `
  },
  {
    NL_TASK: "Set reasoning with transitivity",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@mammals Animals Contains Mammals
		@dogs @mammals Contains Dogs
		@fido @dogs Contains Fido
		@chain1 @mammals And @dogs
		@chain2 @chain1 And @fido
		@isAnimal @chain2 Implies FidoIsAnimal
		@persist5 $chain2 Persist Setreasoningwithtransitivity
		@describe5 $chain2 Describe Setreasoningwithtransitivity
    `,
    NL_OUTPUT: "Fido is animal through set chain",
    DSL_OUTPUT: `
		@persist5 $chain2 Persist Setreasoningwithtransitivity
		@describe5 $chain2 Describe Setreasoningwithtransitivity
    `,
    DSL_TRACE: `
		@mammals Animals Contains Mammals
		@dogs @mammals Contains Dogs
		@fido @dogs Contains Fido
		@chain1 @mammals And @dogs
		@chain2 @chain1 And @fido
		@isAnimal @chain2 Implies FidoIsAnimal
		@persist5 $chain2 Persist Setreasoningwithtransitivity
		@describe5 $chain2 Describe Setreasoningwithtransitivity
    `
  },
  {
    NL_TASK: "Medical diagnosis: symptoms + history -> diagnosis -> treatment",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@symptom1 Patient Is HasFever
		@symptom2 Patient Is HasCough
		@symptoms @symptom1 And @symptom2
		@history Patient Is Smoker
		@evidence @symptoms And @history
		@diagnosis @evidence Implies Bronchitis
		@treatment @diagnosis LeadsTo Antibiotics
		@persist6 $diagnosis Persist Medicaldiagnosissymptomshistorydiagnosistreatment
		@describe6 $diagnosis Describe Medicaldiagnosissymptomshistorydiagnosistreatment
    `,
    NL_OUTPUT: "Symptoms + history -> diagnosis -> treatment",
    DSL_OUTPUT: `
		@persist6 $diagnosis Persist Medicaldiagnosissymptomshistorydiagnosistreatment
		@describe6 $diagnosis Describe Medicaldiagnosissymptomshistorydiagnosistreatment
    `,
    DSL_TRACE: `
		@symptom1 Patient Is HasFever
		@symptom2 Patient Is HasCough
		@symptoms @symptom1 And @symptom2
		@history Patient Is Smoker
		@evidence @symptoms And @history
		@diagnosis @evidence Implies Bronchitis
		@treatment @diagnosis LeadsTo Antibiotics
		@persist6 $diagnosis Persist Medicaldiagnosissymptomshistorydiagnosistreatment
		@describe6 $diagnosis Describe Medicaldiagnosissymptomshistorydiagnosistreatment
    `
  },
  {
    NL_TASK: "Resource allocation with constraints and planning",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@res1 Project Requires Developer
		@res2 Project Requires Designer
		@conflict Developer Excludes SamePerson
		@team @res1 And @res2
		@valid @team And @conflict
		@canStart @valid LeadsTo ProjectStart
		@persist7 $valid Persist Resourceallocationwithconstraintsandplanning
		@describe7 $valid Describe Resourceallocationwithconstraintsandplanning
    `,
    NL_OUTPUT: "Project needs different people for roles",
    DSL_OUTPUT: `
		@persist7 $valid Persist Resourceallocationwithconstraintsandplanning
		@describe7 $valid Describe Resourceallocationwithconstraintsandplanning
    `,
    DSL_TRACE: `
		@res1 Project Requires Developer
		@res2 Project Requires Designer
		@conflict Developer Excludes SamePerson
		@team @res1 And @res2
		@valid @team And @conflict
		@canStart @valid LeadsTo ProjectStart
		@persist7 $valid Persist Resourceallocationwithconstraintsandplanning
		@describe7 $valid Describe Resourceallocationwithconstraintsandplanning
    `
  },
  {
    NL_TASK: "Legal reasoning: law + facts -> verdict",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@law Contract Requires Signature
		@fact1 Document Is Signed
		@fact2 Parties Is Agreed
		@facts @fact1 And @fact2
		@lawMet @facts Implies ContractValid
		@binding @lawMet And @law
		@verdict @binding LeadsTo Enforceable
		@persist8 $binding Persist Legalreasoninglawfactsverdict
		@describe8 $binding Describe Legalreasoninglawfactsverdict
    `,
    NL_OUTPUT: "Contract valid and enforceable",
    DSL_OUTPUT: `
		@persist8 $binding Persist Legalreasoninglawfactsverdict
		@describe8 $binding Describe Legalreasoninglawfactsverdict
    `,
    DSL_TRACE: `
		@law Contract Requires Signature
		@fact1 Document Is Signed
		@fact2 Parties Is Agreed
		@facts @fact1 And @fact2
		@lawMet @facts Implies ContractValid
		@binding @lawMet And @law
		@verdict @binding LeadsTo Enforceable
		@persist8 $binding Persist Legalreasoninglawfactsverdict
		@describe8 $binding Describe Legalreasoninglawfactsverdict
    `
  },
  {
    NL_TASK: "Scientific reasoning: hypothesis + evidence -> conclusion",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@hyp Theory Is Hypothesis
		@exp1 Experiment1 Is Supports
		@exp2 Experiment2 Is Supports
		@exp3 Experiment3 Is Contradicts
		@support @exp1 And @exp2
		@evidence @support And @exp3
		@weight @support GreaterThan @exp3
		@conclusion @weight Implies HypothesisLikelyTrue
		@persist9 $weight Persist Scientificreasoninghypothesisevidenceconclusion
		@describe9 $weight Describe Scientificreasoninghypothesisevidenceconclusion
    `,
    NL_OUTPUT: "More support than contradiction -> likely true",
    DSL_OUTPUT: `
		@persist9 $weight Persist Scientificreasoninghypothesisevidenceconclusion
		@describe9 $weight Describe Scientificreasoninghypothesisevidenceconclusion
    `,
    DSL_TRACE: `
		@hyp Theory Is Hypothesis
		@exp1 Experiment1 Is Supports
		@exp2 Experiment2 Is Supports
		@exp3 Experiment3 Is Contradicts
		@support @exp1 And @exp2
		@evidence @support And @exp3
		@weight @support GreaterThan @exp3
		@conclusion @weight Implies HypothesisLikelyTrue
		@persist9 $weight Persist Scientificreasoninghypothesisevidenceconclusion
		@describe9 $weight Describe Scientificreasoninghypothesisevidenceconclusion
    `
  },
  {
    NL_TASK: "Complex decision: multiple criteria weighted and combined",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@crit1 Option1 Is GoodOnCost
		@crit2 Option1 Is BadOnTime
		@crit3 Option1 Is GoodOnQuality
		@pos @crit1 And @crit3
		@neg @crit2 Is Negative
		@weighted @pos GreaterThan @neg
		@overall @weighted Summarize Option1Score
		@decision @overall Implies ChooseOption1
		@persist10 $overall Persist Complexdecisionmultiplecriteriaweightedandcombined
		@describe10 $overall Describe Complexdecisionmultiplecriteriaweightedandcombined
    `,
    NL_OUTPUT: "Multi-criteria decision making",
    DSL_OUTPUT: `
		@persist10 $overall Persist Complexdecisionmultiplecriteriaweightedandcombined
		@describe10 $overall Describe Complexdecisionmultiplecriteriaweightedandcombined
    `,
    DSL_TRACE: `
		@crit1 Option1 Is GoodOnCost
		@crit2 Option1 Is BadOnTime
		@crit3 Option1 Is GoodOnQuality
		@pos @crit1 And @crit3
		@neg @crit2 Is Negative
		@weighted @pos GreaterThan @neg
		@overall @weighted Summarize Option1Score
		@decision @overall Implies ChooseOption1
		@persist10 $overall Persist Complexdecisionmultiplecriteriaweightedandcombined
		@describe10 $overall Describe Complexdecisionmultiplecriteriaweightedandcombined
    `
  }
];