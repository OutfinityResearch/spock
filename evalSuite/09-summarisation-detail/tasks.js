// Reformatted tasks (no .trim, 2-tab indent)
module.exports = [
  {
    NL_TASK: "Summarize single fact",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@fact Weather Is Sunny
		@summary @fact Distill @fact
		@persist1 $fact Persist Summarizesinglefact
		@describe1 $fact Describe Summarizesinglefact

    `,
    NL_OUTPUT: "Single fact distilled",
    DSL_OUTPUT: `

		@persist1 $fact Persist Summarizesinglefact
		@describe1 $fact Describe Summarizesinglefact

    `,
    DSL_TRACE: `

		@fact Weather Is Sunny
		@summary @fact Distill @fact
		@persist1 $fact Persist Summarizesinglefact
		@describe1 $fact Describe Summarizesinglefact

    `
  },
  {
    NL_TASK: "Summarize three related facts",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@f1 Sky Is Blue
		@f2 Sun Is Shining
		@f3 Temp Is Warm
		@combined @f1 Aggregate @f2
		@all @combined Aggregate @f3
		@summary @all Distill @all
		@persist2 $all Persist Summarizethreerelatedfacts
		@describe2 $all Describe Summarizethreerelatedfacts

    `,
    NL_OUTPUT: "Weather summary: nice day",
    DSL_OUTPUT: `

		@persist2 $all Persist Summarizethreerelatedfacts
		@describe2 $all Describe Summarizethreerelatedfacts

    `,
    DSL_TRACE: `

		@f1 Sky Is Blue
		@f2 Sun Is Shining
		@f3 Temp Is Warm
		@combined @f1 Aggregate @f2
		@all @combined Aggregate @f3
		@summary @all Distill @all
		@persist2 $all Persist Summarizethreerelatedfacts
		@describe2 $all Describe Summarizethreerelatedfacts

    `
  },
  {
    NL_TASK: "Document with sections summarized",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@intro Doc HasPart Introduction
		@body Doc HasPart MainContent
		@concl Doc HasPart Conclusion
		@struct @intro Aggregate @body
		@full @struct Aggregate @concl
		@summary @full Summarize Doc
		@persist3 $full Persist Documentwithsectionssummarized
		@describe3 $full Describe Documentwithsectionssummarized

    `,
    NL_OUTPUT: "Document structure summarized",
    DSL_OUTPUT: `

		@persist3 $full Persist Documentwithsectionssummarized
		@describe3 $full Describe Documentwithsectionssummarized

    `,
    DSL_TRACE: `

		@intro Doc HasPart Introduction
		@body Doc HasPart MainContent
		@concl Doc HasPart Conclusion
		@struct @intro Aggregate @body
		@full @struct Aggregate @concl
		@summary @full Summarize Doc
		@persist3 $full Persist Documentwithsectionssummarized
		@describe3 $full Describe Documentwithsectionssummarized

    `
  },
  {
    NL_TASK: "Hierarchical summarization",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@ch1 Book HasPart Chapter1
		@ch2 Book HasPart Chapter2
		@ch3 Book HasPart Chapter3
		@part1 @ch1 Aggregate @ch2
		@wholebook @part1 Aggregate @ch3
		@boosSummary @wholebook Distill @wholebook
		@persist4 $wholebook Persist Hierarchicalsummarization
		@describe4 $wholebook Describe Hierarchicalsummarization

    `,
    NL_OUTPUT: "Book summarized from chapters",
    DSL_OUTPUT: `

		@persist4 $wholebook Persist Hierarchicalsummarization
		@describe4 $wholebook Describe Hierarchicalsummarization

    `,
    DSL_TRACE: `

		@ch1 Book HasPart Chapter1
		@ch2 Book HasPart Chapter2
		@ch3 Book HasPart Chapter3
		@part1 @ch1 Aggregate @ch2
		@wholebook @part1 Aggregate @ch3
		@boosSummary @wholebook Distill @wholebook
		@persist4 $wholebook Persist Hierarchicalsummarization
		@describe4 $wholebook Describe Hierarchicalsummarization

    `
  },
  {
    NL_TASK: "Multi-level detail control",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@detailed Report Is FullReport
		@medium @detailed DetailLevel 0.5
		@brief @detailed DetailLevel 0.2
		@comparison @medium Distance @brief
		@persist5 $brief Persist Multileveldetailcontrol
		@describe5 $brief Describe Multileveldetailcontrol

    `,
    NL_OUTPUT: "Compare summaries at different detail levels",
    DSL_OUTPUT: `

		@persist5 $brief Persist Multileveldetailcontrol
		@describe5 $brief Describe Multileveldetailcontrol

    `,
    DSL_TRACE: `

		@detailed Report Is FullReport
		@medium @detailed DetailLevel 0.5
		@brief @detailed DetailLevel 0.2
		@comparison @medium Distance @brief
		@persist5 $brief Persist Multileveldetailcontrol
		@describe5 $brief Describe Multileveldetailcontrol

    `
  },
  {
    NL_TASK: "Event sequence summarization",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@e1 Event1 Is Morning
		@e2 Event2 Is Afternoon
		@e3 Event3 Is Evening
		@e4 Event4 Is Night
		@morning @e1 Distill @e1
		@afternoon @e2 Distill @e2
		@day @morning Aggregate @afternoon
		@evening @e3 Distill @e3
		@fullDay @day Aggregate @evening
		@summary @fullDay Summarize DaySummary
		@persist6 $fullDay Persist Eventsequencesummarization
		@describe6 $fullDay Describe Eventsequencesummarization

    `,
    NL_OUTPUT: "Day summarized from events",
    DSL_OUTPUT: `

		@persist6 $fullDay Persist Eventsequencesummarization
		@describe6 $fullDay Describe Eventsequencesummarization

    `,
    DSL_TRACE: `

		@e1 Event1 Is Morning
		@e2 Event2 Is Afternoon
		@e3 Event3 Is Evening
		@e4 Event4 Is Night
		@morning @e1 Distill @e1
		@afternoon @e2 Distill @e2
		@day @morning Aggregate @afternoon
		@evening @e3 Distill @e3
		@fullDay @day Aggregate @evening
		@summary @fullDay Summarize DaySummary
		@persist6 $fullDay Persist Eventsequencesummarization
		@describe6 $fullDay Describe Eventsequencesummarization

    `
  },
  {
    NL_TASK: "Meeting notes summarization",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@topic1 Meeting HasPart BudgetDiscussion
		@topic2 Meeting HasPart TeamUpdates
		@topic3 Meeting HasPart ActionItems
		@topics @topic1 Aggregate @topic2
		@allTopics @topics Aggregate @topic3
		@minutes @allTopics Distill @allTopics
		@persist7 $allTopics Persist Meetingnotessummarization
		@describe7 $allTopics Describe Meetingnotessummarization

    `,
    NL_OUTPUT: "Meeting minutes summarized",
    DSL_OUTPUT: `

		@persist7 $allTopics Persist Meetingnotessummarization
		@describe7 $allTopics Describe Meetingnotessummarization

    `,
    DSL_TRACE: `

		@topic1 Meeting HasPart BudgetDiscussion
		@topic2 Meeting HasPart TeamUpdates
		@topic3 Meeting HasPart ActionItems
		@topics @topic1 Aggregate @topic2
		@allTopics @topics Aggregate @topic3
		@minutes @allTopics Distill @allTopics
		@persist7 $allTopics Persist Meetingnotessummarization
		@describe7 $allTopics Describe Meetingnotessummarization

    `
  },
  {
    NL_TASK: "Project status summarization",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@dev Development Is OnTrack
		@test Testing Is Delayed
		@deploy Deployment Is Planned
		@status1 @dev Aggregate @test
		@fullStatus @status1 Aggregate @deploy
		@projectSummary @fullStatus Summarize ProjectStatus
		@persist8 $fullStatus Persist Projectstatussummarization
		@describe8 $fullStatus Describe Projectstatussummarization

    `,
    NL_OUTPUT: "Project status summary",
    DSL_OUTPUT: `

		@persist8 $fullStatus Persist Projectstatussummarization
		@describe8 $fullStatus Describe Projectstatussummarization

    `,
    DSL_TRACE: `

		@dev Development Is OnTrack
		@test Testing Is Delayed
		@deploy Deployment Is Planned
		@status1 @dev Aggregate @test
		@fullStatus @status1 Aggregate @deploy
		@projectSummary @fullStatus Summarize ProjectStatus
		@persist8 $fullStatus Persist Projectstatussummarization
		@describe8 $fullStatus Describe Projectstatussummarization

    `
  },
  {
    NL_TASK: "Nested summarization with distillation",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@raw1 Data1 Is RawData
		@raw2 Data2 Is RawData
		@raw3 Data3 Is RawData
		@proc1 @raw1 Distill @raw1
		@proc2 @raw2 Distill @raw2
		@proc3 @raw3 Distill @raw3
		@combined @proc1 Aggregate @proc2
		@all @combined Aggregate @proc3
		@final @all Distill @all
		@persist9 $all Persist Nestedsummarizationwithdistillation
		@describe9 $all Describe Nestedsummarizationwithdistillation

    `,
    NL_OUTPUT: "Raw data distilled and combined",
    DSL_OUTPUT: `

		@persist9 $all Persist Nestedsummarizationwithdistillation
		@describe9 $all Describe Nestedsummarizationwithdistillation

    `,
    DSL_TRACE: `

		@raw1 Data1 Is RawData
		@raw2 Data2 Is RawData
		@raw3 Data3 Is RawData
		@proc1 @raw1 Distill @raw1
		@proc2 @raw2 Distill @raw2
		@proc3 @raw3 Distill @raw3
		@combined @proc1 Aggregate @proc2
		@all @combined Aggregate @proc3
		@final @all Distill @all
		@persist9 $all Persist Nestedsummarizationwithdistillation
		@describe9 $all Describe Nestedsummarizationwithdistillation

    `
  },
  {
    NL_TASK: "Research paper summarization",
    TASK_TYPE: "Summarise",
    DSL_TASK: `

		@abstract Paper HasPart Abstract
		@intro Paper HasPart Introduction
		@method Paper HasPart Methodology
		@results Paper HasPart Results
		@discussion Paper HasPart Discussion
		@p1 @abstract Aggregate @intro
		@p2 @p1 Aggregate @method
		@p3 @p2 Aggregate @results
		@full @p3 Aggregate @discussion
		@paperSummary @full Summarize ResearchSummary
		@persist10 $full Persist Researchpapersummarization
		@describe10 $full Describe Researchpapersummarization

    `,
    NL_OUTPUT: "Research paper summarized",
    DSL_OUTPUT: `

		@persist10 $full Persist Researchpapersummarization
		@describe10 $full Describe Researchpapersummarization

    `,
    DSL_TRACE: `

		@abstract Paper HasPart Abstract
		@intro Paper HasPart Introduction
		@method Paper HasPart Methodology
		@results Paper HasPart Results
		@discussion Paper HasPart Discussion
		@p1 @abstract Aggregate @intro
		@p2 @p1 Aggregate @method
		@p3 @p2 Aggregate @results
		@full @p3 Aggregate @discussion
		@paperSummary @full Summarize ResearchSummary
		@persist10 $full Persist Researchpapersummarization
		@describe10 $full Describe Researchpapersummarization

    `
  }
];