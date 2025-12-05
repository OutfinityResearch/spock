// Linear Planning Evaluation Suite
// Tests sequential planning, state transitions, and goal achievement
module.exports = [
  {
    NL_TASK: "Where is the agent currently located?",
    DESCRIPTION: "Define the initial state of an agent for planning scenarios.",
    TASK_TYPE: "Learn",
    DSL_TASK: `
		@initial Agent State AtHome
		@persist1 $initial Persist agentLocation
    `,
    NL_OUTPUT: "The agent is currently at home.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@initial Agent State AtHome
		@persist1 $initial Persist agentLocation
    `
  },
  {
    NL_TASK: "What is the agent's goal?",
    DESCRIPTION: "Define the goal state that the agent needs to achieve.",
    TASK_TYPE: "Learn",
    DSL_TASK: `
		@goal Agent State AtWork
		@persist2 $goal Persist agentGoal
    `,
    NL_OUTPUT: "The agent's goal is to be at work.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@goal Agent State AtWork
		@persist2 $goal Persist agentGoal
    `
  },
  {
    NL_TASK: "How can the agent get from home to work?",
    DESCRIPTION: "Generate a simple two-step plan: get in car, drive to work.",
    TASK_TYPE: "Plan",
    DSL_TASK: `
		@s0 Agent State AtHome
		@a1 GetInCar Action Drive
		@s1 $s0 LeadsTo InCar
		@a2 $s1 Action ArriveWork
		@s2 $a2 LeadsTo AtWork
		@goal Agent State AtWork
		@plan $s2 Achieves $goal
		@persist3 $plan Persist commuteplan
    `,
    NL_OUTPUT: "Plan: (1) Get in car, (2) Drive to work. This achieves the goal of being at work.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@s0 Agent State AtHome
		@a1 GetInCar Action Drive
		@s1 $s0 LeadsTo InCar
		@a2 $s1 Action ArriveWork
		@s2 $a2 LeadsTo AtWork
		@goal Agent State AtWork
		@plan $s2 Achieves $goal
		@persist3 $plan Persist commuteplan
    `
  },
  {
    NL_TASK: "What if driving requires having car keys first?",
    DESCRIPTION: "Test planning with preconditions: must have key and be at car before driving.",
    TASK_TYPE: "Plan",
    DSL_TASK: `
		@hasKey Agent State HasCarKey
		@atCar Agent State AtCar
		@canDrive $hasKey Enables $atCar
		@driving $canDrive Action StartDriving
		@atDest $driving LeadsTo AtDestination
		@result $atDest Achieves AtWork
		@persist4 $result Persist planWithPreconditions
    `,
    NL_OUTPUT: "Plan with preconditions: (1) Get car key, (2) Go to car, (3) Start driving, (4) Arrive at destination.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@hasKey Agent State HasCarKey
		@atCar Agent State AtCar
		@canDrive $hasKey Enables $atCar
		@driving $canDrive Action StartDriving
		@atDest $driving LeadsTo AtDestination
		@result $atDest Achieves AtWork
		@persist4 $result Persist planWithPreconditions
    `
  },
  {
    NL_TASK: "How do you cook a meal from ingredients?",
    DESCRIPTION: "Generate a multi-step cooking plan: prep → cook → serve.",
    TASK_TYPE: "Plan",
    DSL_TASK: `
		@s0 Kitchen State HasIngredients
		@a1 $s0 Action Prepare
		@s1 $a1 LeadsTo Prepped
		@a2 $s1 Action Cook
		@s2 $a2 LeadsTo Cooked
		@a3 $s2 Action Serve
		@s3 $a3 LeadsTo MealReady
		@goal Kitchen State MealReady
		@plan $s3 Achieves $goal
		@persist5 $plan Persist cookingPlan
    `,
    NL_OUTPUT: "Cooking plan: (1) Prepare ingredients, (2) Cook the food, (3) Serve the meal. Result: meal is ready.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@s0 Kitchen State HasIngredients
		@a1 $s0 Action Prepare
		@s1 $a1 LeadsTo Prepped
		@a2 $s1 Action Cook
		@s2 $a2 LeadsTo Cooked
		@a3 $s2 Action Serve
		@s3 $a3 LeadsTo MealReady
		@goal Kitchen State MealReady
		@plan $s3 Achieves $goal
		@persist5 $plan Persist cookingPlan
    `
  },
  {
    NL_TASK: "Plan a shopping trip with two stops: grocery store and hardware store.",
    DESCRIPTION: "Generate a multi-location shopping plan with sequential stops.",
    TASK_TYPE: "Plan",
    DSL_TASK: `
		@s0 Shopper State AtHome
		@a1 $s0 Action GoToStore1
		@s1 $a1 LeadsTo AtStore1
		@a2 $s1 Action BuyGroceries
		@s2 $a2 LeadsTo HasGroceries
		@a3 $s2 Action GoToStore2
		@s3 $a3 LeadsTo AtStore2
		@a4 $s3 Action BuyHardware
		@s4 $a4 LeadsTo HasAll
		@plan $s4 Achieves ShoppingDone
		@persist6 $plan Persist shoppingPlan
    `,
    NL_OUTPUT: "Shopping plan: (1) Go to grocery store, (2) Buy groceries, (3) Go to hardware store, (4) Buy hardware. Done!",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@s0 Shopper State AtHome
		@a1 $s0 Action GoToStore1
		@s1 $a1 LeadsTo AtStore1
		@a2 $s1 Action BuyGroceries
		@s2 $a2 LeadsTo HasGroceries
		@a3 $s2 Action GoToStore2
		@s3 $a3 LeadsTo AtStore2
		@a4 $s3 Action BuyHardware
		@s4 $a4 LeadsTo HasAll
		@plan $s4 Achieves ShoppingDone
		@persist6 $plan Persist shoppingPlan
    `
  },
  {
    NL_TASK: "How do you manufacture and ship a product?",
    DESCRIPTION: "Generate an assembly line plan: parts → assemble → test → ship.",
    TASK_TYPE: "Plan",
    DSL_TASK: `
		@parts Factory State HasParts
		@assembled $parts Action Assemble
		@product $assembled LeadsTo Assembled
		@tested $product Action Test
		@verified $tested LeadsTo Tested
		@shipped $verified Action Ship
		@done $shipped LeadsTo Shipped
		@goal Factory State Shipped
		@plan $done Achieves $goal
		@persist7 $plan Persist assemblyPlan
    `,
    NL_OUTPUT: "Assembly plan: (1) Assemble parts, (2) Test the product, (3) Ship to customer. Product delivered!",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@parts Factory State HasParts
		@assembled $parts Action Assemble
		@product $assembled LeadsTo Assembled
		@tested $product Action Test
		@verified $tested LeadsTo Tested
		@shipped $verified Action Ship
		@done $shipped LeadsTo Shipped
		@goal Factory State Shipped
		@plan $done Achieves $goal
		@persist7 $plan Persist assemblyPlan
    `
  },
  {
    NL_TASK: "What if Task1 and Task2 must both complete before the main task can start?",
    DESCRIPTION: "Test parallel prerequisites that must both be satisfied before proceeding.",
    TASK_TYPE: "Plan",
    DSL_TASK: `
		@prereq1 Task1 State Complete
		@prereq2 Task2 State Complete
		@combined $prereq1 Add $prereq2
		@enabled $combined Enables MainTask
		@action $enabled Action Execute
		@result $action LeadsTo Done
		@plan $result Achieves ProjectComplete
		@persist8 $plan Persist parallelPrereqs
    `,
    NL_OUTPUT: "Both Task1 and Task2 must complete first. Then the main task can execute to complete the project.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@prereq1 Task1 State Complete
		@prereq2 Task2 State Complete
		@combined $prereq1 Add $prereq2
		@enabled $combined Enables MainTask
		@action $enabled Action Execute
		@result $action LeadsTo Done
		@plan $result Achieves ProjectComplete
		@persist8 $plan Persist parallelPrereqs
    `
  },
  {
    NL_TASK: "Plan an international trip: pack, taxi, airport, fly, arrive.",
    DESCRIPTION: "Generate a five-step travel plan with sequential dependencies.",
    TASK_TYPE: "Plan",
    DSL_TASK: `
		@s0 Traveler State AtHome
		@a1 $s0 Action Pack
		@s1 $a1 LeadsTo Packed
		@a2 $s1 Action CallTaxi
		@s2 $a2 LeadsTo InTaxi
		@a3 $s2 Action GoAirport
		@s3 $a3 LeadsTo AtAirport
		@a4 $s3 Action Board
		@s4 $a4 LeadsTo OnPlane
		@a5 $s4 Action Fly
		@s5 $a5 LeadsTo AtDestCity
		@plan $s5 Achieves Arrived
		@persist9 $plan Persist travelPlan
    `,
    NL_OUTPUT: "Travel plan: (1) Pack bags, (2) Call taxi, (3) Go to airport, (4) Board plane, (5) Fly to destination. Arrived!",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@s0 Traveler State AtHome
		@a1 $s0 Action Pack
		@s1 $a1 LeadsTo Packed
		@a2 $s1 Action CallTaxi
		@s2 $a2 LeadsTo InTaxi
		@a3 $s2 Action GoAirport
		@s3 $a3 LeadsTo AtAirport
		@a4 $s3 Action Board
		@s4 $a4 LeadsTo OnPlane
		@a5 $s4 Action Fly
		@s5 $a5 LeadsTo AtDestCity
		@plan $s5 Achieves Arrived
		@persist9 $plan Persist travelPlan
    `
  },
  {
    NL_TASK: "How do you deploy software to production?",
    DESCRIPTION: "Generate a software deployment pipeline: write → test → review → stage → deploy.",
    TASK_TYPE: "Plan",
    DSL_TASK: `
		@code Dev State CodeWritten
		@tested $code Action RunTests
		@green $tested LeadsTo TestsPassed
		@reviewed $green Action CodeReview
		@approved $reviewed LeadsTo Approved
		@staged $approved Action DeployStaging
		@stagingOk $staged LeadsTo StagingVerified
		@prod $stagingOk Action DeployProd
		@live $prod LeadsTo InProduction
		@plan $live Achieves Deployed
		@persist10 $plan Persist deploymentPlan
    `,
    NL_OUTPUT: "Deployment plan: (1) Run tests, (2) Code review, (3) Deploy to staging, (4) Verify staging, (5) Deploy to production. Software is live!",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@code Dev State CodeWritten
		@tested $code Action RunTests
		@green $tested LeadsTo TestsPassed
		@reviewed $green Action CodeReview
		@approved $reviewed LeadsTo Approved
		@staged $approved Action DeployStaging
		@stagingOk $staged LeadsTo StagingVerified
		@prod $stagingOk Action DeployProd
		@live $prod LeadsTo InProduction
		@plan $live Achieves Deployed
		@persist10 $plan Persist deploymentPlan
    `
  }
];
