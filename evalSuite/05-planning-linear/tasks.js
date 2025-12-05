// Reformatted tasks (no .trim, 2-tab indent)
module.exports = [
  {
    NL_TASK: "Define initial state: at home",
    TASK_TYPE: "Learn",
    DSL_TASK: `

		@initial Agent State AtHome
		@persist1 $initial Persist Defineinitialstateathome
		@describe1 $initial Describe Defineinitialstateathome

    `,
    NL_OUTPUT: "Agent starts at home",
    DSL_OUTPUT: `

		@persist1 $initial Persist Defineinitialstateathome
		@describe1 $initial Describe Defineinitialstateathome

    `,
    DSL_TRACE: `

		@initial Agent State AtHome
		@persist1 $initial Persist Defineinitialstateathome
		@describe1 $initial Describe Defineinitialstateathome

    `
  },
  {
    NL_TASK: "Define goal state: at work",
    TASK_TYPE: "Learn",
    DSL_TASK: `

		@goal Agent State AtWork
		@persist2 $goal Persist Definegoalstateatwork
		@describe2 $goal Describe Definegoalstateatwork

    `,
    NL_OUTPUT: "Goal is to be at work",
    DSL_OUTPUT: `

		@persist2 $goal Persist Definegoalstateatwork
		@describe2 $goal Describe Definegoalstateatwork

    `,
    DSL_TRACE: `

		@goal Agent State AtWork
		@persist2 $goal Persist Definegoalstateatwork
		@describe2 $goal Describe Definegoalstateatwork

    `
  },
  {
    NL_TASK: "Simple two-step plan: home -> car -> work",
    TASK_TYPE: "Plan",
    DSL_TASK: `

		@s0 Agent State AtHome
		@a1 GetInCar Action Drive
		@s1 @s0 LeadsTo InCar
		@a2 @s1 Action ArriveWork
		@s2 @a2 LeadsTo AtWork
		@goal Agent State AtWork
		@plan @s2 Achieves @goal
		@persist3 $goal Persist Simpletwostepplanhomecarwork
		@describe3 $goal Describe Simpletwostepplanhomecarwork

    `,
    NL_OUTPUT: "Plan: get in car, drive to work",
    DSL_OUTPUT: `

		@persist3 $goal Persist Simpletwostepplanhomecarwork
		@describe3 $goal Describe Simpletwostepplanhomecarwork

    `,
    DSL_TRACE: `

		@s0 Agent State AtHome
		@a1 GetInCar Action Drive
		@s1 @s0 LeadsTo InCar
		@a2 @s1 Action ArriveWork
		@s2 @a2 LeadsTo AtWork
		@goal Agent State AtWork
		@plan @s2 Achieves @goal
		@persist3 $goal Persist Simpletwostepplanhomecarwork
		@describe3 $goal Describe Simpletwostepplanhomecarwork

    `
  },
  {
    NL_TASK: "Three-step plan with preconditions",
    TASK_TYPE: "Plan",
    DSL_TASK: `

		@hasKey Agent State HasCarKey
		@atCar Agent State AtCar
		@canDrive @hasKey Enables @atCar
		@driving @canDrive Action StartDriving
		@atDest @driving LeadsTo AtDestination
		@result @atDest Achieves AtWork
		@persist4 $atDest Persist Threestepplanwithpreconditions
		@describe4 $atDest Describe Threestepplanwithpreconditions

    `,
    NL_OUTPUT: "Need key and be at car to drive",
    DSL_OUTPUT: `

		@persist4 $atDest Persist Threestepplanwithpreconditions
		@describe4 $atDest Describe Threestepplanwithpreconditions

    `,
    DSL_TRACE: `

		@hasKey Agent State HasCarKey
		@atCar Agent State AtCar
		@canDrive @hasKey Enables @atCar
		@driving @canDrive Action StartDriving
		@atDest @driving LeadsTo AtDestination
		@result @atDest Achieves AtWork
		@persist4 $atDest Persist Threestepplanwithpreconditions
		@describe4 $atDest Describe Threestepplanwithpreconditions

    `
  },
  {
    NL_TASK: "Cooking plan: ingredients -> prep -> cook -> serve",
    TASK_TYPE: "Plan",
    DSL_TASK: `

		@s0 Kitchen State HasIngredients
		@a1 @s0 Action Prepare
		@s1 @a1 LeadsTo Prepped
		@a2 @s1 Action Cook
		@s2 @a2 LeadsTo Cooked
		@a3 @s2 Action Serve
		@s3 @a3 LeadsTo MealReady
		@goal Kitchen State MealReady
		@plan @s3 Achieves @goal
		@persist5 $goal Persist Cookingplaningredientsprepcookserve
		@describe5 $goal Describe Cookingplaningredientsprepcookserve

    `,
    NL_OUTPUT: "Four-step cooking plan",
    DSL_OUTPUT: `

		@persist5 $goal Persist Cookingplaningredientsprepcookserve
		@describe5 $goal Describe Cookingplaningredientsprepcookserve

    `,
    DSL_TRACE: `

		@s0 Kitchen State HasIngredients
		@a1 @s0 Action Prepare
		@s1 @a1 LeadsTo Prepped
		@a2 @s1 Action Cook
		@s2 @a2 LeadsTo Cooked
		@a3 @s2 Action Serve
		@s3 @a3 LeadsTo MealReady
		@goal Kitchen State MealReady
		@plan @s3 Achieves @goal
		@persist5 $goal Persist Cookingplaningredientsprepcookserve
		@describe5 $goal Describe Cookingplaningredientsprepcookserve

    `
  },
  {
    NL_TASK: "Shopping plan with multiple stops",
    TASK_TYPE: "Plan",
    DSL_TASK: `

		@s0 Shopper State AtHome
		@a1 @s0 Action GoToStore1
		@s1 @a1 LeadsTo AtStore1
		@a2 @s1 Action BuyGroceries
		@s2 @a2 LeadsTo HasGroceries
		@a3 @s2 Action GoToStore2
		@s3 @a3 LeadsTo AtStore2
		@a4 @s3 Action BuyHardware
		@s4 @a4 LeadsTo HasAll
		@plan @s4 Achieves ShoppingDone
		@persist6 $s4 Persist Shoppingplanwithmultiplestops
		@describe6 $s4 Describe Shoppingplanwithmultiplestops

    `,
    NL_OUTPUT: "Multi-stop shopping plan",
    DSL_OUTPUT: `

		@persist6 $s4 Persist Shoppingplanwithmultiplestops
		@describe6 $s4 Describe Shoppingplanwithmultiplestops

    `,
    DSL_TRACE: `

		@s0 Shopper State AtHome
		@a1 @s0 Action GoToStore1
		@s1 @a1 LeadsTo AtStore1
		@a2 @s1 Action BuyGroceries
		@s2 @a2 LeadsTo HasGroceries
		@a3 @s2 Action GoToStore2
		@s3 @a3 LeadsTo AtStore2
		@a4 @s3 Action BuyHardware
		@s4 @a4 LeadsTo HasAll
		@plan @s4 Achieves ShoppingDone
		@persist6 $s4 Persist Shoppingplanwithmultiplestops
		@describe6 $s4 Describe Shoppingplanwithmultiplestops

    `
  },
  {
    NL_TASK: "Assembly plan: parts -> assemble -> test -> ship",
    TASK_TYPE: "Plan",
    DSL_TASK: `

		@parts Factory State HasParts
		@assembled @parts Action Assemble
		@product @assembled LeadsTo Assembled
		@tested @product Action Test
		@verified @tested LeadsTo Tested
		@shipped @verified Action Ship
		@done @shipped LeadsTo Shipped
		@goal Factory State Shipped
		@plan @done Achieves @goal
		@persist7 $goal Persist Assemblyplanpartsassembletestship
		@describe7 $goal Describe Assemblyplanpartsassembletestship

    `,
    NL_OUTPUT: "Assembly line plan",
    DSL_OUTPUT: `

		@persist7 $goal Persist Assemblyplanpartsassembletestship
		@describe7 $goal Describe Assemblyplanpartsassembletestship

    `,
    DSL_TRACE: `

		@parts Factory State HasParts
		@assembled @parts Action Assemble
		@product @assembled LeadsTo Assembled
		@tested @product Action Test
		@verified @tested LeadsTo Tested
		@shipped @verified Action Ship
		@done @shipped LeadsTo Shipped
		@goal Factory State Shipped
		@plan @done Achieves @goal
		@persist7 $goal Persist Assemblyplanpartsassembletestship
		@describe7 $goal Describe Assemblyplanpartsassembletestship

    `
  },
  {
    NL_TASK: "Parallel prerequisites then sequence",
    TASK_TYPE: "Plan",
    DSL_TASK: `

		@prereq1 Task1 State Complete
		@prereq2 Task2 State Complete
		@combined @prereq1 Add @prereq2
		@enabled @combined Enables MainTask
		@action @enabled Action Execute
		@result @action LeadsTo Done
		@plan @result Achieves ProjectComplete
		@persist8 $result Persist Parallelprerequisitesthensequence
		@describe8 $result Describe Parallelprerequisitesthensequence

    `,
    NL_OUTPUT: "Two prerequisites enable main task",
    DSL_OUTPUT: `

		@persist8 $result Persist Parallelprerequisitesthensequence
		@describe8 $result Describe Parallelprerequisitesthensequence

    `,
    DSL_TRACE: `

		@prereq1 Task1 State Complete
		@prereq2 Task2 State Complete
		@combined @prereq1 Add @prereq2
		@enabled @combined Enables MainTask
		@action @enabled Action Execute
		@result @action LeadsTo Done
		@plan @result Achieves ProjectComplete
		@persist8 $result Persist Parallelprerequisitesthensequence
		@describe8 $result Describe Parallelprerequisitesthensequence

    `
  },
  {
    NL_TASK: "Travel plan: pack -> taxi -> airport -> fly -> arrive",
    TASK_TYPE: "Plan",
    DSL_TASK: `

		@s0 Traveler State AtHome
		@a1 @s0 Action Pack
		@s1 @a1 LeadsTo Packed
		@a2 @s1 Action CallTaxi
		@s2 @a2 LeadsTo InTaxi
		@a3 @s2 Action GoAirport
		@s3 @a3 LeadsTo AtAirport
		@a4 @s3 Action Board
		@s4 @a4 LeadsTo OnPlane
		@a5 @s4 Action Fly
		@s5 @a5 LeadsTo AtDestCity
		@plan @s5 Achieves Arrived
		@persist9 $s5 Persist Travelplanpacktaxiairportflyarrive
		@describe9 $s5 Describe Travelplanpacktaxiairportflyarrive

    `,
    NL_OUTPUT: "Five-step travel plan",
    DSL_OUTPUT: `

		@persist9 $s5 Persist Travelplanpacktaxiairportflyarrive
		@describe9 $s5 Describe Travelplanpacktaxiairportflyarrive

    `,
    DSL_TRACE: `

		@s0 Traveler State AtHome
		@a1 @s0 Action Pack
		@s1 @a1 LeadsTo Packed
		@a2 @s1 Action CallTaxi
		@s2 @a2 LeadsTo InTaxi
		@a3 @s2 Action GoAirport
		@s3 @a3 LeadsTo AtAirport
		@a4 @s3 Action Board
		@s4 @a4 LeadsTo OnPlane
		@a5 @s4 Action Fly
		@s5 @a5 LeadsTo AtDestCity
		@plan @s5 Achieves Arrived
		@persist9 $s5 Persist Travelplanpacktaxiairportflyarrive
		@describe9 $s5 Describe Travelplanpacktaxiairportflyarrive

    `
  },
  {
    NL_TASK: "Software deployment plan",
    TASK_TYPE: "Plan",
    DSL_TASK: `

		@code Dev State CodeWritten
		@tested @code Action RunTests
		@green @tested LeadsTo TestsPassed
		@reviewed @green Action CodeReview
		@approved @reviewed LeadsTo Approved
		@staged @approved Action DeployStaging
		@stagingOk @staged LeadsTo StagingVerified
		@prod @stagingOk Action DeployProd
		@live @prod LeadsTo InProduction
		@plan @live Achieves Deployed
		@persist10 $live Persist Softwaredeploymentplan
		@describe10 $live Describe Softwaredeploymentplan

    `,
    NL_OUTPUT: "Software deployment pipeline",
    DSL_OUTPUT: `

		@persist10 $live Persist Softwaredeploymentplan
		@describe10 $live Describe Softwaredeploymentplan

    `,
    DSL_TRACE: `

		@code Dev State CodeWritten
		@tested @code Action RunTests
		@green @tested LeadsTo TestsPassed
		@reviewed @green Action CodeReview
		@approved @reviewed LeadsTo Approved
		@staged @approved Action DeployStaging
		@stagingOk @staged LeadsTo StagingVerified
		@prod @stagingOk Action DeployProd
		@live @prod LeadsTo InProduction
		@plan @live Achieves Deployed
		@persist10 $live Persist Softwaredeploymentplan
		@describe10 $live Describe Softwaredeploymentplan

    `
  }
];