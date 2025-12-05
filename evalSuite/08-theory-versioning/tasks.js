// Reformatted tasks (no .trim, 2-tab indent)
module.exports = [
  {
    NL_TASK: "Create base version of a fact",
    TASK_TYPE: "Learn",
    DSL_TASK: `

		@v1 Concept Is Definition1
		@persist1 $v1 Persist Createbaseversionofafact
		@describe1 $v1 Describe Createbaseversionofafact

    `,
    NL_OUTPUT: "Version 1 of concept defined",
    DSL_OUTPUT: `

		@persist1 $v1 Persist Createbaseversionofafact
		@describe1 $v1 Describe Createbaseversionofafact

    `,
    DSL_TRACE: `

		@v1 Concept Is Definition1
		@persist1 $v1 Persist Createbaseversionofafact
		@describe1 $v1 Describe Createbaseversionofafact

    `
  },
  {
    NL_TASK: "Override with new version",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@v1 Concept Is OldDef
		@v2 Concept Override NewDef
		@current @v2 Distance @v1
		@persist2 $v1 Persist Overridewithnewversion
		@describe2 $v1 Describe Overridewithnewversion

    `,
    NL_OUTPUT: "New version differs from old",
    DSL_OUTPUT: `

		@persist2 $v1 Persist Overridewithnewversion
		@describe2 $v1 Describe Overridewithnewversion

    `,
    DSL_TRACE: `

		@v1 Concept Is OldDef
		@v2 Concept Override NewDef
		@current @v2 Distance @v1
		@persist2 $v1 Persist Overridewithnewversion
		@describe2 $v1 Describe Overridewithnewversion

    `
  },
  {
    NL_TASK: "Extend existing definition",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@base Animal Is Living
		@extended @base Extend HasLegs
		@combined @extended Extend Breathes
		@persist3 $extended Persist Extendexistingdefinition
		@describe3 $extended Describe Extendexistingdefinition

    `,
    NL_OUTPUT: "Animal extended with multiple properties",
    DSL_OUTPUT: `

		@persist3 $extended Persist Extendexistingdefinition
		@describe3 $extended Describe Extendexistingdefinition

    `,
    DSL_TRACE: `

		@base Animal Is Living
		@extended @base Extend HasLegs
		@combined @extended Extend Breathes
		@persist3 $extended Persist Extendexistingdefinition
		@describe3 $extended Describe Extendexistingdefinition

    `
  },
  {
    NL_TASK: "Merge two branches",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@branch1 Feature Is Implementation1
		@branch2 Feature Is Implementation2
		@merged @branch1 Merge @branch2
		@persist4 $branch2 Persist Mergetwobranches
		@describe4 $branch2 Describe Mergetwobranches

    `,
    NL_OUTPUT: "Two implementations merged",
    DSL_OUTPUT: `

		@persist4 $branch2 Persist Mergetwobranches
		@describe4 $branch2 Describe Mergetwobranches

    `,
    DSL_TRACE: `

		@branch1 Feature Is Implementation1
		@branch2 Feature Is Implementation2
		@merged @branch1 Merge @branch2
		@persist4 $branch2 Persist Mergetwobranches
		@describe4 $branch2 Describe Mergetwobranches

    `
  },
  {
    NL_TASK: "Create and compare branches",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@main Product Is BaseVersion
		@exp1 @main Branch Experimental1
		@exp2 @main Branch Experimental2
		@divergence @exp1 Distance @exp2
		@compat @exp1 Compatible @exp2
		@persist5 $exp2 Persist Createandcomparebranches
		@describe5 $exp2 Describe Createandcomparebranches

    `,
    NL_OUTPUT: "Check if experimental branches compatible",
    DSL_OUTPUT: `

		@persist5 $exp2 Persist Createandcomparebranches
		@describe5 $exp2 Describe Createandcomparebranches

    `,
    DSL_TRACE: `

		@main Product Is BaseVersion
		@exp1 @main Branch Experimental1
		@exp2 @main Branch Experimental2
		@divergence @exp1 Distance @exp2
		@compat @exp1 Compatible @exp2
		@persist5 $exp2 Persist Createandcomparebranches
		@describe5 $exp2 Describe Createandcomparebranches

    `
  },
  {
    NL_TASK: "Version chain: v1 -> v2 -> v3",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@v1 System Is Version1
		@v2 @v1 Extend Feature1
		@v3 @v2 Extend Feature2
		@progress @v3 Distance @v1
		@persist6 $v1 Persist Versionchainv1v2v3
		@describe6 $v1 Describe Versionchainv1v2v3

    `,
    NL_OUTPUT: "Measure evolution from v1 to v3",
    DSL_OUTPUT: `

		@persist6 $v1 Persist Versionchainv1v2v3
		@describe6 $v1 Describe Versionchainv1v2v3

    `,
    DSL_TRACE: `

		@v1 System Is Version1
		@v2 @v1 Extend Feature1
		@v3 @v2 Extend Feature2
		@progress @v3 Distance @v1
		@persist6 $v1 Persist Versionchainv1v2v3
		@describe6 $v1 Describe Versionchainv1v2v3

    `
  },
  {
    NL_TASK: "Override then extend",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@original Algo Is SlowVersion
		@faster @original Override FastVersion
		@withCache @faster Extend Caching
		@final @withCache Extend Logging
		@persist7 $withCache Persist Overridethenextend
		@describe7 $withCache Describe Overridethenextend

    `,
    NL_OUTPUT: "Override then extend multiple times",
    DSL_OUTPUT: `

		@persist7 $withCache Persist Overridethenextend
		@describe7 $withCache Describe Overridethenextend

    `,
    DSL_TRACE: `

		@original Algo Is SlowVersion
		@faster @original Override FastVersion
		@withCache @faster Extend Caching
		@final @withCache Extend Logging
		@persist7 $withCache Persist Overridethenextend
		@describe7 $withCache Describe Overridethenextend

    `
  },
  {
    NL_TASK: "Three-way merge",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@base Config Is BaseConfig
		@dev @base Branch DevChanges
		@test @base Branch TestChanges
		@prod @base Branch ProdChanges
		@merge1 @dev Merge @test
		@final @merge1 Merge @prod
		@persist8 $prod Persist Threewaymerge
		@describe8 $prod Describe Threewaymerge

    `,
    NL_OUTPUT: "Merge dev, test, and prod branches",
    DSL_OUTPUT: `

		@persist8 $prod Persist Threewaymerge
		@describe8 $prod Describe Threewaymerge

    `,
    DSL_TRACE: `

		@base Config Is BaseConfig
		@dev @base Branch DevChanges
		@test @base Branch TestChanges
		@prod @base Branch ProdChanges
		@merge1 @dev Merge @test
		@final @merge1 Merge @prod
		@persist8 $prod Persist Threewaymerge
		@describe8 $prod Describe Threewaymerge

    `
  },
  {
    NL_TASK: "Check compatibility chain",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@api1 API Is Version1
		@api2 @api1 Extend NewEndpoint
		@api3 @api2 Override BreakingChange
		@compat12 @api1 Compatible @api2
		@compat23 @api2 Compatible @api3
		@compat13 @api1 Compatible @api3
		@persist9 $api3 Persist Checkcompatibilitychain
		@describe9 $api3 Describe Checkcompatibilitychain

    `,
    NL_OUTPUT: "Check API compatibility across versions",
    DSL_OUTPUT: `

		@persist9 $api3 Persist Checkcompatibilitychain
		@describe9 $api3 Describe Checkcompatibilitychain

    `,
    DSL_TRACE: `

		@api1 API Is Version1
		@api2 @api1 Extend NewEndpoint
		@api3 @api2 Override BreakingChange
		@compat12 @api1 Compatible @api2
		@compat23 @api2 Compatible @api3
		@compat13 @api1 Compatible @api3
		@persist9 $api3 Persist Checkcompatibilitychain
		@describe9 $api3 Describe Checkcompatibilitychain

    `
  },
  {
    NL_TASK: "Complex versioning scenario",
    TASK_TYPE: "Ask",
    DSL_TASK: `

		@v1 Module Is Initial
		@v1a @v1 Branch FeatureA
		@v1b @v1 Branch FeatureB
		@v2a @v1a Extend Enhancement
		@v2b @v1b Extend OtherEnhancement
		@merged @v2a Merge @v2b
		@v3 @merged Extend FinalFeature
		@evolution @v3 Distance @v1
		@persist10 $v1 Persist Complexversioningscenario
		@describe10 $v1 Describe Complexversioningscenario

    `,
    NL_OUTPUT: "Track evolution through branch-merge cycle",
    DSL_OUTPUT: `

		@persist10 $v1 Persist Complexversioningscenario
		@describe10 $v1 Describe Complexversioningscenario

    `,
    DSL_TRACE: `

		@v1 Module Is Initial
		@v1a @v1 Branch FeatureA
		@v1b @v1 Branch FeatureB
		@v2a @v1a Extend Enhancement
		@v2b @v1b Extend OtherEnhancement
		@merged @v2a Merge @v2b
		@v3 @merged Extend FinalFeature
		@evolution @v3 Distance @v1
		@persist10 $v1 Persist Complexversioningscenario
		@describe10 $v1 Describe Complexversioningscenario

    `
  }
];