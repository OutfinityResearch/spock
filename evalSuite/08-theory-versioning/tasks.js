// Theory Versioning Evaluation Suite
// Tests theory branching, merging, extending, and version compatibility
module.exports = [
  {
    NL_TASK: "Define the initial version of a concept.",
    DESCRIPTION: "Create a base version of a concept definition to establish a starting point for versioning.",
    TASK_TYPE: "Learn",
    DSL_TASK: `
		@v1 Concept Is Definition1
		@persist1 $v1 Persist conceptV1
    `,
    NL_OUTPUT: "Version 1 of the concept has been defined as 'Definition1'.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@v1 Concept Is Definition1
		@persist1 $v1 Persist conceptV1
    `
  },
  {
    NL_TASK: "How does the new definition differ from the old one?",
    DESCRIPTION: "Override a concept with a new version and measure the semantic distance.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@v1 Concept Is OldDef
		@v2 Concept Override NewDef
		@current $v2 Distance $v1
		@persist2 $current Persist versionDiff
    `,
    NL_OUTPUT: "The new definition differs from the old one. The Override operation replaced 'OldDef' with 'NewDef', and Distance measures how much they differ semantically.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@v1 Concept Is OldDef
		@v2 Concept Override NewDef
		@current $v2 Distance $v1
		@persist2 $current Persist versionDiff
    `
  },
  {
    NL_TASK: "Add new properties to an existing animal definition.",
    DESCRIPTION: "Extend an existing concept by adding additional properties (HasLegs, Breathes).",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@base Animal Is Living
		@extended $base Extend HasLegs
		@combined $extended Extend Breathes
		@persist3 $combined Persist extendedAnimal
    `,
    NL_OUTPUT: "The Animal concept has been extended: Animal is Living, has legs, and breathes. Each Extend operation adds a property to the definition.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@base Animal Is Living
		@extended $base Extend HasLegs
		@combined $extended Extend Breathes
		@persist3 $combined Persist extendedAnimal
    `
  },
  {
    NL_TASK: "Merge two different implementations of the same feature.",
    DESCRIPTION: "Test merging two branches of a feature that evolved independently.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@branch1 Feature Is Implementation1
		@branch2 Feature Is Implementation2
		@merged $branch1 Merge $branch2
		@persist4 $merged Persist mergedFeature
    `,
    NL_OUTPUT: "The two implementations have been merged. Implementation1 and Implementation2 are now combined into a single unified feature definition.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@branch1 Feature Is Implementation1
		@branch2 Feature Is Implementation2
		@merged $branch1 Merge $branch2
		@persist4 $merged Persist mergedFeature
    `
  },
  {
    NL_TASK: "Are the two experimental branches compatible with each other?",
    DESCRIPTION: "Branch from a base version and compare the divergence between experimental branches.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@main Product Is BaseVersion
		@exp1 $main Branch Experimental1
		@exp2 $main Branch Experimental2
		@divergence $exp1 Distance $exp2
		@compat $exp1 Compatible $exp2
		@persist5 $compat Persist branchComparison
    `,
    NL_OUTPUT: "The two experimental branches have been compared. Distance measures how far they diverged, and Compatible checks if they can be merged without conflicts.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@main Product Is BaseVersion
		@exp1 $main Branch Experimental1
		@exp2 $main Branch Experimental2
		@divergence $exp1 Distance $exp2
		@compat $exp1 Compatible $exp2
		@persist5 $compat Persist branchComparison
    `
  },
  {
    NL_TASK: "How much has the system evolved from v1 to v3?",
    DESCRIPTION: "Track evolution through a version chain: v1 → v2 → v3.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@v1 System Is Version1
		@v2 $v1 Extend Feature1
		@v3 $v2 Extend Feature2
		@progress $v3 Distance $v1
		@persist6 $progress Persist versionEvolution
    `,
    NL_OUTPUT: "The system has evolved through three versions. V1 was extended with Feature1 to create V2, then V2 was extended with Feature2 to create V3. Distance measures the total semantic change from V1 to V3.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@v1 System Is Version1
		@v2 $v1 Extend Feature1
		@v3 $v2 Extend Feature2
		@progress $v3 Distance $v1
		@persist6 $progress Persist versionEvolution
    `
  },
  {
    NL_TASK: "Replace a slow version with a fast one, then add caching and logging.",
    DESCRIPTION: "Test override followed by multiple extensions.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@original Algo Is SlowVersion
		@faster $original Override FastVersion
		@withCache $faster Extend Caching
		@final $withCache Extend Logging
		@persist7 $final Persist optimizedAlgo
    `,
    NL_OUTPUT: "The algorithm has been optimized: the slow version was replaced with a fast version (Override), then caching and logging were added (Extend). Final result: FastVersion + Caching + Logging.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@original Algo Is SlowVersion
		@faster $original Override FastVersion
		@withCache $faster Extend Caching
		@final $withCache Extend Logging
		@persist7 $final Persist optimizedAlgo
    `
  },
  {
    NL_TASK: "Merge dev, test, and prod branches into a single configuration.",
    DESCRIPTION: "Test three-way merge: combine three independent branches.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@base Config Is BaseConfig
		@dev $base Branch DevChanges
		@test $base Branch TestChanges
		@prod $base Branch ProdChanges
		@merge1 $dev Merge $test
		@final $merge1 Merge $prod
		@persist8 $final Persist threeWayMerge
    `,
    NL_OUTPUT: "Three branches have been merged: Dev + Test → intermediate, then intermediate + Prod → final. The result combines changes from all three environments.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@base Config Is BaseConfig
		@dev $base Branch DevChanges
		@test $base Branch TestChanges
		@prod $base Branch ProdChanges
		@merge1 $dev Merge $test
		@final $merge1 Merge $prod
		@persist8 $final Persist threeWayMerge
    `
  },
  {
    NL_TASK: "Is API v3 backwards-compatible with v1?",
    DESCRIPTION: "Check compatibility across a chain of API versions with breaking changes.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@api1 API Is Version1
		@api2 $api1 Extend NewEndpoint
		@api3 $api2 Override BreakingChange
		@compat12 $api1 Compatible $api2
		@compat23 $api2 Compatible $api3
		@compat13 $api1 Compatible $api3
		@persist9 $compat13 Persist apiCompatibility
    `,
    NL_OUTPUT: "V1 → V2 is compatible (only added endpoint). V2 → V3 has a breaking change (Override). V1 → V3 is NOT backwards-compatible due to the breaking change in V3.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@api1 API Is Version1
		@api2 $api1 Extend NewEndpoint
		@api3 $api2 Override BreakingChange
		@compat12 $api1 Compatible $api2
		@compat23 $api2 Compatible $api3
		@compat13 $api1 Compatible $api3
		@persist9 $compat13 Persist apiCompatibility
    `
  },
  {
    NL_TASK: "What is the total evolution from initial module to final version after branching and merging?",
    DESCRIPTION: "Test complex versioning: branch, extend, merge, and measure overall evolution.",
    TASK_TYPE: "Ask",
    DSL_TASK: `
		@v1 Module Is Initial
		@v1a $v1 Branch FeatureA
		@v1b $v1 Branch FeatureB
		@v2a $v1a Extend Enhancement
		@v2b $v1b Extend OtherEnhancement
		@merged $v2a Merge $v2b
		@v3 $merged Extend FinalFeature
		@evolution $v3 Distance $v1
		@persist10 $evolution Persist complexEvolution
    `,
    NL_OUTPUT: "Complex evolution: Initial → Branch A (FeatureA) → Enhanced; Initial → Branch B (FeatureB) → Enhanced; Branches merged → Final feature added. Distance measures total semantic evolution from Initial to V3.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@v1 Module Is Initial
		@v1a $v1 Branch FeatureA
		@v1b $v1 Branch FeatureB
		@v2a $v1a Extend Enhancement
		@v2b $v1b Extend OtherEnhancement
		@merged $v2a Merge $v2b
		@v3 $merged Extend FinalFeature
		@evolution $v3 Distance $v1
		@persist10 $evolution Persist complexEvolution
    `
  }
];
