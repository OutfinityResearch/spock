// Mixed Reasoning Evaluation Suite
// Tests combinations of logic, causality, planning, numeric, and constraint reasoning
module.exports = [
  {
    NL_TASK: "It's raining, rain causes wet ground, and wet implies slippery. Is it dangerous?",
    DESCRIPTION: "Test mixed logic and causality: combine causal chain with logical implication.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@rain Weather Is Rainy
		@wet $rain Causes WetGround
		@slippery $wet Implies SlipperyRoad
		@danger $slippery And $rain
		@persist1 $danger Persist weatherDanger
    `,
    NL_OUTPUT: "Yes, it's dangerous. Rain causes wet ground, wet ground implies slippery road. Combined with the rain, this creates a dangerous situation.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@rain Weather Is Rainy
		@wet $rain Causes WetGround
		@slippery $wet Implies SlipperyRoad
		@danger $slippery And $rain
		@persist1 $danger Persist weatherDanger
    `
  },
  {
    NL_TASK: "We need step A before B, but A excludes C. Can we also do C?",
    DESCRIPTION: "Test planning with mutual exclusion constraints.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@needA Task Requires StepA
		@beforeB StepA LeadsTo StepB
		@conflict StepA Excludes StepC
		@plan $needA And $beforeB
		@constrained $plan And $conflict
		@persist2 $constrained Persist planningConflict
    `,
    NL_OUTPUT: "No, you cannot do C. The plan requires A, A leads to B, but A excludes C. If you perform A (necessary for B), you cannot perform C.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@needA Task Requires StepA
		@beforeB StepA LeadsTo StepB
		@conflict StepA Excludes StepC
		@plan $needA And $beforeB
		@constrained $plan And $conflict
		@persist2 $constrained Persist planningConflict
    `
  },
  {
    NL_TASK: "Budget is low, project cost is high. Do we need approval?",
    DESCRIPTION: "Test numeric comparison with logical consequence.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@budget Amount Is LowBudget
		@cost Project Is HighCost
		@overBudget $cost GreaterThan $budget
		@needApproval $overBudget Implies RequiresApproval
		@decision $needApproval And $overBudget
		@persist3 $decision Persist budgetDecision
    `,
    NL_OUTPUT: "Yes, approval is required. The project cost exceeds the budget, and over-budget projects require approval.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@budget Amount Is LowBudget
		@cost Project Is HighCost
		@overBudget $cost GreaterThan $budget
		@needApproval $overBudget Implies RequiresApproval
		@decision $needApproval And $overBudget
		@persist3 $decision Persist budgetDecision
    `
  },
  {
    NL_TASK: "Factor1 causes Effect1, Factor2 causes Effect2. Summarize the combined impact.",
    DESCRIPTION: "Test causal chain with summarization.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@cause1 Factor1 Causes Effect1
		@cause2 Factor2 Causes Effect2
		@combined $cause1 And $cause2
		@chain $combined LeadsTo FinalEffect
		@summary $chain Summarize OverallImpact
		@persist4 $summary Persist causalSummary
    `,
    NL_OUTPUT: "Summary: Factor1 causes Effect1, Factor2 causes Effect2. Together, they lead to a combined final effect.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@cause1 Factor1 Causes Effect1
		@cause2 Factor2 Causes Effect2
		@combined $cause1 And $cause2
		@chain $combined LeadsTo FinalEffect
		@summary $chain Summarize OverallImpact
		@persist4 $summary Persist causalSummary
    `
  },
  {
    NL_TASK: "Animals contain Mammals, Mammals contain Dogs, Dogs contain Fido. Is Fido an animal?",
    DESCRIPTION: "Test set containment with transitive reasoning.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@mammals Animals Contains Mammals
		@dogs $mammals Contains Dogs
		@fido $dogs Contains Fido
		@chain1 $mammals And $dogs
		@chain2 $chain1 And $fido
		@isAnimal $chain2 Implies FidoIsAnimal
		@persist5 $isAnimal Persist setReasoning
    `,
    NL_OUTPUT: "Yes, Fido is an animal. Through transitive set containment: Animals → Mammals → Dogs → Fido. Therefore, Fido belongs to Animals.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@mammals Animals Contains Mammals
		@dogs $mammals Contains Dogs
		@fido $dogs Contains Fido
		@chain1 $mammals And $dogs
		@chain2 $chain1 And $fido
		@isAnimal $chain2 Implies FidoIsAnimal
		@persist5 $isAnimal Persist setReasoning
    `
  },
  {
    NL_TASK: "Patient has fever and cough, is a smoker. What's the diagnosis and treatment?",
    DESCRIPTION: "Test medical reasoning: symptoms + history → diagnosis → treatment.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@symptom1 Patient Is HasFever
		@symptom2 Patient Is HasCough
		@symptoms $symptom1 And $symptom2
		@history Patient Is Smoker
		@evidence $symptoms And $history
		@diagnosis $evidence Implies Bronchitis
		@treatment $diagnosis LeadsTo Antibiotics
		@persist6 $treatment Persist medicalReasoning
    `,
    NL_OUTPUT: "Diagnosis: Bronchitis. The combination of fever, cough, and smoking history suggests bronchitis. Treatment: Antibiotics.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@symptom1 Patient Is HasFever
		@symptom2 Patient Is HasCough
		@symptoms $symptom1 And $symptom2
		@history Patient Is Smoker
		@evidence $symptoms And $history
		@diagnosis $evidence Implies Bronchitis
		@treatment $diagnosis LeadsTo Antibiotics
		@persist6 $treatment Persist medicalReasoning
    `
  },
  {
    NL_TASK: "Project needs a Developer and Designer, but they can't be the same person. Can we start?",
    DESCRIPTION: "Test resource allocation with constraints and planning.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@res1 Project Requires Developer
		@res2 Project Requires Designer
		@conflict Developer Excludes SamePerson
		@team $res1 And $res2
		@valid $team And $conflict
		@canStart $valid LeadsTo ProjectStart
		@persist7 $canStart Persist resourceAllocation
    `,
    NL_OUTPUT: "The project can start if Developer and Designer are different people. The constraint requires two separate individuals for these roles.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@res1 Project Requires Developer
		@res2 Project Requires Designer
		@conflict Developer Excludes SamePerson
		@team $res1 And $res2
		@valid $team And $conflict
		@canStart $valid LeadsTo ProjectStart
		@persist7 $canStart Persist resourceAllocation
    `
  },
  {
    NL_TASK: "Contract requires signature, document is signed, parties agreed. Is it enforceable?",
    DESCRIPTION: "Test legal reasoning: law + facts → verdict.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@law Contract Requires Signature
		@fact1 Document Is Signed
		@fact2 Parties Is Agreed
		@facts $fact1 And $fact2
		@lawMet $facts Implies ContractValid
		@binding $lawMet And $law
		@verdict $binding LeadsTo Enforceable
		@persist8 $verdict Persist legalReasoning
    `,
    NL_OUTPUT: "Yes, the contract is enforceable. The law requires a signature (present), the document is signed, and parties agreed. All conditions are met for a valid, enforceable contract.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@law Contract Requires Signature
		@fact1 Document Is Signed
		@fact2 Parties Is Agreed
		@facts $fact1 And $fact2
		@lawMet $facts Implies ContractValid
		@binding $lawMet And $law
		@verdict $binding LeadsTo Enforceable
		@persist8 $verdict Persist legalReasoning
    `
  },
  {
    NL_TASK: "Two experiments support a hypothesis, one contradicts it. Is the hypothesis likely true?",
    DESCRIPTION: "Test scientific reasoning: weigh supporting vs contradicting evidence.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@hyp Theory Is Hypothesis
		@exp1 Experiment1 Is Supports
		@exp2 Experiment2 Is Supports
		@exp3 Experiment3 Is Contradicts
		@support $exp1 And $exp2
		@evidence $support And $exp3
		@weight $support GreaterThan $exp3
		@conclusion $weight Implies HypothesisLikelyTrue
		@persist9 $conclusion Persist scientificReasoning
    `,
    NL_OUTPUT: "The hypothesis is likely true. Two experiments support it while only one contradicts. The weight of supporting evidence (2:1) favors the hypothesis.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@hyp Theory Is Hypothesis
		@exp1 Experiment1 Is Supports
		@exp2 Experiment2 Is Supports
		@exp3 Experiment3 Is Contradicts
		@support $exp1 And $exp2
		@evidence $support And $exp3
		@weight $support GreaterThan $exp3
		@conclusion $weight Implies HypothesisLikelyTrue
		@persist9 $conclusion Persist scientificReasoning
    `
  },
  {
    NL_TASK: "Option1 is good on cost and quality but bad on time. Should we choose it?",
    DESCRIPTION: "Test multi-criteria decision making with weighted factors.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@crit1 Option1 Is GoodOnCost
		@crit2 Option1 Is BadOnTime
		@crit3 Option1 Is GoodOnQuality
		@pos $crit1 And $crit3
		@neg $crit2 Is Negative
		@weighted $pos GreaterThan $neg
		@overall $weighted Summarize Option1Score
		@decision $overall Implies ChooseOption1
		@persist10 $decision Persist multiCriteriaDecision
    `,
    NL_OUTPUT: "Yes, choose Option1. It scores well on cost and quality (2 positive factors) and poorly only on time (1 negative factor). The positives outweigh the negatives.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@crit1 Option1 Is GoodOnCost
		@crit2 Option1 Is BadOnTime
		@crit3 Option1 Is GoodOnQuality
		@pos $crit1 And $crit3
		@neg $crit2 Is Negative
		@weighted $pos GreaterThan $neg
		@overall $weighted Summarize Option1Score
		@decision $overall Implies ChooseOption1
		@persist10 $decision Persist multiCriteriaDecision
    `
  }
];
