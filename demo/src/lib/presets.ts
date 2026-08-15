/** The demo gallery: one source per feature worth showing. */
export const presets: { name: string; desc: string; src: string }[] = [
	{
		name: 'flowchart',
		desc: 'nodes, branches, edge labels',
		src: `flowchart TD
  A[Parse source] --> B{Supported?}
  B -->|yes| C[Lay out]
  B -->|no| D[Framed source]
  C --> E[Unicode art]
  D --> E`
	},
	{
		name: 'title',
		desc: 'frontmatter title over the art',
		src: `---
title: Deploy pipeline
---
flowchart LR
  Build --> Test
  Test --> Ship
  Ship --> Done`
	},
	{
		name: 'shapes',
		desc: 'v2 @{shape, label} node syntax',
		src: `flowchart TD
  S@{shape: start, label: "Boot"} --> D@{shape: cyl, label: "Config DB"}
  D --> Q@{shape: diamond, label: "Valid?"}
  Q -->|yes| P@{shape: stadium, label: "Run app"}
  Q -->|no| E@{shape: dbl-circ, label: "Halt"}`
	},
	{
		name: 'subgraph',
		desc: 'nested titled frames',
		src: `flowchart TD
  In[Request] --> R
  subgraph svc [Service]
    R[Router] --> H1[Handler A]
    R --> H2[Handler B]
  end
  H1 --> Out[(Store)]
  H2 --> Out`
	},
	{
		name: 'cycles',
		desc: 'back and skip edges route around',
		src: `flowchart TD
  A[Fetch] --> B{OK?}
  B -->|yes| C[Parse]
  B -->|no| R[Backoff]
  R --> A
  C --> D[Render]
  A -.->|cache hit| D`
	},
	{
		name: 'pipeline',
		desc: 'retry loops at several depths',
		src: `flowchart TD
  push[Git push] --> ci{CI green?}
  ci -->|yes| build[Build image]
  ci -->|no| notify[Notify author]
  build --> stage[Deploy staging]
  stage --> smoke{Smoke tests}
  smoke -->|flaky| stage
  smoke -->|pass| prod[Deploy prod]
  smoke -->|fail| notify
  prod --> monitor[Monitor SLOs]
  monitor -->|regression| roll[Rollback]
  roll --> stage
  notify --> push`
	},
	{
		name: 'pipeline-lr',
		desc: 'sideways: skips run straight through clear rows',
		src: `flowchart LR
  push[Git push] --> ci{CI green?}
  ci -->|yes| build[Build image]
  ci -->|no| notify[Notify author]
  build --> stage[Deploy staging]
  stage --> smoke{Smoke}
  smoke -->|pass| prod[Ship]
  smoke -->|fail| notify`
	},
	{
		name: 'sequence',
		desc: 'participants, messages, notes',
		src: `sequenceDiagram
  participant U as User
  participant T as Terminal
  participant R as Renderer
  U->>T: mermaid source
  T->>R: render()
  R-->>T: unicode art
  T-->>U: pretty boxes`
	},
	{
		name: 'activations',
		desc: 'hot lifelines between +/- marks',
		src: `sequenceDiagram
  Client->>+Server: request
  Server->>+DB: query
  DB-->>-Server: rows
  Server-->>-Client: response`
	},
	{
		name: 'state',
		desc: 'transitions, start/end markers',
		src: `stateDiagram-v2
  [*] --> Idle
  Idle --> Parsing: source arrives
  Parsing --> Drawing: parse ok
  Parsing --> Framed: parse fails
  Drawing --> [*]
  Framed --> [*]`
	},
	{
		name: 'composite',
		desc: 'nested states and -- regions',
		src: `stateDiagram-v2
  [*] --> Idle
  Idle --> Active
  state Active {
    [*] --> Fetching
    Fetching --> Rendering
    Rendering --> Fetching : retry
    --
    Log --> Flush
  }
  Active --> [*]`
	},
	{
		name: 'class',
		desc: 'compartments, members, relations',
		src: `classDiagram
  class MermaidArt {
    +plain: string[]
    +styled: Span[][]
    +width: number
    +warnings: string[]
  }
  class Span {
    +text: string
    +role: Role
  }
  MermaidArt "1" --> "*" Span : rows of`
	},
	{
		name: 'styles',
		desc: 'classDef colors, best-effort applied',
		src: `flowchart TD
  A[Request]:::hot --> B{Authorized?}
  B -->|yes| C[Serve]:::ok
  B -->|no| D[401 Denied]:::err
  C --> E[(Cache)]
  class E cold
  classDef hot fill:#ff9966,color:#000000
  classDef ok stroke:#22a06b,color:#22a06b
  classDef err fill:#8b0000,color:#ffdddd
  classDef cold fill:lightblue,color:#000000,font-weight:bold`
	},
	{
		name: 'state-styles',
		desc: ':::class + classDef in state diagrams',
		src: `stateDiagram-v2
  [*] --> Healthy
  Healthy --> Degraded : probe fails
  Degraded --> Healthy : recovers
  Degraded --> Down:::alert : timeout
  Down --> [*]
  class Healthy ok
  classDef ok stroke:#22a06b,color:#22a06b
  classDef alert fill:#8b0000,color:#ffdddd,font-weight:bold`
	},
	{
		name: 'links',
		desc: 'click/link → OSC 8 hyperlinks',
		src: `flowchart TD
  A[README] --> B{Where?}
  B -->|terminal| C[npm]
  B -->|browser| D[GitHub]
  click C "https://www.npmjs.com/package/lovely-mermaid"
  click D "https://github.com/xl0/lovely-mermaid"`
	},
	{
		name: 'er',
		desc: 'cardinalities at edge ends, aliases',
		src: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  c["Credit Card"] |o--|| CUSTOMER : pays with`
	},
	{
		name: 'mindmap',
		desc: 'indentation tree with TUI guides',
		src: `mindmap
  root((lovely-mermaid))
    Parsing
      Lenient
      Streaming
    Layout
      Sugiyama
      Lanes
    Output
      Roles
      Classes`
	},
	{
		name: 'timeline',
		desc: 'periods and events, sections',
		src: `timeline
  title Project history
  section Port
  2026-07 : Byte-faithful port : Differential harness
  section Redesign
  2026-08 : Lenient parsing : Semantic spans
          : New diagram types`
	},
	{
		name: 'pie',
		desc: 'proportions as a bar list',
		src: `pie showData title Render targets
  "Terminals" : 62
  "TUIs" : 25
  "CI logs" : 13`
	},
	{
		name: 'gitgraph',
		desc: 'commit lanes, git log --graph style',
		src: `gitGraph
  commit id: "scaffold"
  branch feature
  commit id: "parse"
  checkout main
  commit id: "docs"
  merge feature tag: "v1.0"
  commit id: "polish"`
	},
	{
		name: 'cjk',
		desc: 'wide glyphs measured correctly',
		src: `flowchart LR
  A[你好世界] --> B[こんにちは]
  B --> C[🚀 Launch]
  C --> D[Done ✅]`
	},
	{
		name: 'broken',
		desc: 'lenient parsing, advisory warnings',
		src: `flowchart TD
  A[Start --> B
  C --> `
	}
];
