// Summarisation and Detail Evaluation Suite
// Tests summarisation, aggregation, distillation, and detail level control
module.exports = [
  {
    NL_TASK: "Summarize the weather: it's sunny.",
    DESCRIPTION: "Test simple fact distillation to create a concise summary.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@fact Weather Is Sunny
		@summary $fact Distill $fact
		@persist1 $summary Persist weatherSummary
    `,
    NL_OUTPUT: "Weather summary: Sunny. The fact has been distilled into its essence.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@fact Weather Is Sunny
		@summary $fact Distill $fact
		@persist1 $summary Persist weatherSummary
    `
  },
  {
    NL_TASK: "Combine three weather observations into a summary: blue sky, shining sun, warm temperature.",
    DESCRIPTION: "Test aggregation of multiple related facts into a unified summary.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@f1 Sky Is Blue
		@f2 Sun Is Shining
		@f3 Temp Is Warm
		@combined $f1 Aggregate $f2
		@all $combined Aggregate $f3
		@summary $all Distill $all
		@persist2 $summary Persist combinedWeather
    `,
    NL_OUTPUT: "Combined weather summary: Blue sky, shining sun, warm temperature. It's a beautiful day!",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@f1 Sky Is Blue
		@f2 Sun Is Shining
		@f3 Temp Is Warm
		@combined $f1 Aggregate $f2
		@all $combined Aggregate $f3
		@summary $all Distill $all
		@persist2 $summary Persist combinedWeather
    `
  },
  {
    NL_TASK: "Summarize a document with introduction, main content, and conclusion.",
    DESCRIPTION: "Test document structure summarization by aggregating sections.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@intro Doc HasPart Introduction
		@body Doc HasPart MainContent
		@concl Doc HasPart Conclusion
		@struct $intro Aggregate $body
		@full $struct Aggregate $concl
		@summary $full Summarize Doc
		@persist3 $summary Persist docSummary
    `,
    NL_OUTPUT: "Document summary: The document contains an introduction, main content, and conclusion, forming a complete structure.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@intro Doc HasPart Introduction
		@body Doc HasPart MainContent
		@concl Doc HasPart Conclusion
		@struct $intro Aggregate $body
		@full $struct Aggregate $concl
		@summary $full Summarize Doc
		@persist3 $summary Persist docSummary
    `
  },
  {
    NL_TASK: "Create a book summary from three chapters.",
    DESCRIPTION: "Test hierarchical summarization by aggregating chapters into a book summary.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@ch1 Book HasPart Chapter1
		@ch2 Book HasPart Chapter2
		@ch3 Book HasPart Chapter3
		@part1 $ch1 Aggregate $ch2
		@wholebook $part1 Aggregate $ch3
		@bookSummary $wholebook Distill $wholebook
		@persist4 $bookSummary Persist bookSummary
    `,
    NL_OUTPUT: "Book summary: Contains Chapter 1, Chapter 2, and Chapter 3. The chapters have been aggregated and distilled into a cohesive summary.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@ch1 Book HasPart Chapter1
		@ch2 Book HasPart Chapter2
		@ch3 Book HasPart Chapter3
		@part1 $ch1 Aggregate $ch2
		@wholebook $part1 Aggregate $ch3
		@bookSummary $wholebook Distill $wholebook
		@persist4 $bookSummary Persist bookSummary
    `
  },
  {
    NL_TASK: "Compare a medium detail summary with a brief summary of the same report.",
    DESCRIPTION: "Test multi-level detail control with different summary depths.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@detailed Report Is FullReport
		@medium $detailed DetailLevel 0.5
		@brief $detailed DetailLevel 0.2
		@comparison $medium Distance $brief
		@persist5 $comparison Persist detailComparison
    `,
    NL_OUTPUT: "Comparison: The medium summary (50% detail) contains more information than the brief summary (20% detail). Distance measures how much detail was lost.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@detailed Report Is FullReport
		@medium $detailed DetailLevel 0.5
		@brief $detailed DetailLevel 0.2
		@comparison $medium Distance $brief
		@persist5 $comparison Persist detailComparison
    `
  },
  {
    NL_TASK: "Summarize a day's events: morning, afternoon, and evening.",
    DESCRIPTION: "Test event sequence summarization with temporal aggregation.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@e1 Event1 Is Morning
		@e2 Event2 Is Afternoon
		@e3 Event3 Is Evening
		@e4 Event4 Is Night
		@morning $e1 Distill $e1
		@afternoon $e2 Distill $e2
		@day $morning Aggregate $afternoon
		@evening $e3 Distill $e3
		@fullDay $day Aggregate $evening
		@summary $fullDay Summarize DaySummary
		@persist6 $summary Persist daySummary
    `,
    NL_OUTPUT: "Day summary: Morning events, followed by afternoon events, followed by evening events. The full day has been captured in sequence.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@e1 Event1 Is Morning
		@e2 Event2 Is Afternoon
		@e3 Event3 Is Evening
		@e4 Event4 Is Night
		@morning $e1 Distill $e1
		@afternoon $e2 Distill $e2
		@day $morning Aggregate $afternoon
		@evening $e3 Distill $e3
		@fullDay $day Aggregate $evening
		@summary $fullDay Summarize DaySummary
		@persist6 $summary Persist daySummary
    `
  },
  {
    NL_TASK: "Create meeting minutes from budget discussion, team updates, and action items.",
    DESCRIPTION: "Test meeting notes summarization with topic aggregation.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@topic1 Meeting HasPart BudgetDiscussion
		@topic2 Meeting HasPart TeamUpdates
		@topic3 Meeting HasPart ActionItems
		@topics $topic1 Aggregate $topic2
		@allTopics $topics Aggregate $topic3
		@minutes $allTopics Distill $allTopics
		@persist7 $minutes Persist meetingMinutes
    `,
    NL_OUTPUT: "Meeting minutes: Discussed budget, heard team updates, and assigned action items. Key topics have been distilled into a summary.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@topic1 Meeting HasPart BudgetDiscussion
		@topic2 Meeting HasPart TeamUpdates
		@topic3 Meeting HasPart ActionItems
		@topics $topic1 Aggregate $topic2
		@allTopics $topics Aggregate $topic3
		@minutes $allTopics Distill $allTopics
		@persist7 $minutes Persist meetingMinutes
    `
  },
  {
    NL_TASK: "What is the project status? Development is on track, testing is delayed, deployment is planned.",
    DESCRIPTION: "Test project status summarization with multiple status indicators.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@dev Development Is OnTrack
		@test Testing Is Delayed
		@deploy Deployment Is Planned
		@status1 $dev Aggregate $test
		@fullStatus $status1 Aggregate $deploy
		@projectSummary $fullStatus Summarize ProjectStatus
		@persist8 $projectSummary Persist projectStatus
    `,
    NL_OUTPUT: "Project status summary: Development is on track, testing is delayed (needs attention), deployment is planned. Overall: mostly on track with one concern.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@dev Development Is OnTrack
		@test Testing Is Delayed
		@deploy Deployment Is Planned
		@status1 $dev Aggregate $test
		@fullStatus $status1 Aggregate $deploy
		@projectSummary $fullStatus Summarize ProjectStatus
		@persist8 $projectSummary Persist projectStatus
    `
  },
  {
    NL_TASK: "Process three raw data items: distill each, then combine into a final summary.",
    DESCRIPTION: "Test nested summarization with per-item distillation before aggregation.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@raw1 Data1 Is RawData
		@raw2 Data2 Is RawData
		@raw3 Data3 Is RawData
		@proc1 $raw1 Distill $raw1
		@proc2 $raw2 Distill $raw2
		@proc3 $raw3 Distill $raw3
		@combined $proc1 Aggregate $proc2
		@all $combined Aggregate $proc3
		@final $all Distill $all
		@persist9 $final Persist processedData
    `,
    NL_OUTPUT: "Processed data: Each raw data item was distilled individually, then combined. Final summary contains the essence of all three data sources.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@raw1 Data1 Is RawData
		@raw2 Data2 Is RawData
		@raw3 Data3 Is RawData
		@proc1 $raw1 Distill $raw1
		@proc2 $raw2 Distill $raw2
		@proc3 $raw3 Distill $raw3
		@combined $proc1 Aggregate $proc2
		@all $combined Aggregate $proc3
		@final $all Distill $all
		@persist9 $final Persist processedData
    `
  },
  {
    NL_TASK: "Summarize a research paper with abstract, introduction, methodology, results, and discussion.",
    DESCRIPTION: "Test research paper summarization with academic section aggregation.",
    TASK_TYPE: "Summarise",
    DSL_TASK: `
		@abstract Paper HasPart Abstract
		@intro Paper HasPart Introduction
		@method Paper HasPart Methodology
		@results Paper HasPart Results
		@discussion Paper HasPart Discussion
		@p1 $abstract Aggregate $intro
		@p2 $p1 Aggregate $method
		@p3 $p2 Aggregate $results
		@full $p3 Aggregate $discussion
		@paperSummary $full Summarize ResearchSummary
		@persist10 $paperSummary Persist paperSummary
    `,
    NL_OUTPUT: "Research paper summary: Abstract presents the overview, introduction sets context, methodology describes approach, results show findings, discussion interprets implications. Complete academic structure captured.",
    DSL_OUTPUT: ``,
    DSL_TRACE: `
		@abstract Paper HasPart Abstract
		@intro Paper HasPart Introduction
		@method Paper HasPart Methodology
		@results Paper HasPart Results
		@discussion Paper HasPart Discussion
		@p1 $abstract Aggregate $intro
		@p2 $p1 Aggregate $method
		@p3 $p2 Aggregate $results
		@full $p3 Aggregate $discussion
		@paperSummary $full Summarize ResearchSummary
		@persist10 $paperSummary Persist paperSummary
    `
  }
];
