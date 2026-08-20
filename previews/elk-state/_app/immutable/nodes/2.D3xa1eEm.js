import{$ as e,A as t,B as n,C as r,D as i,E as a,F as o,G as s,H as c,J as l,K as u,L as d,M as f,N as p,O as m,P as h,T as g,V as _,W as ee,Y as te,Z as v,_ as y,a as b,at as ne,et as x,f as S,g as C,i as w,it as re,k as T,l as E,lt as D,q as O,s as k,tt as A,u as j,ut as M,v as N,w as P,y as F}from"../chunks/BqGZ7Ome.js";import{s as ie}from"../chunks/C6lQxieQ.js";import"../chunks/xihTtKlq.js";import{I,L,N as R,P as z,T as B}from"../chunks/tAw1bA0B.js";import{_ as ae,a as oe,c as se,g as V,h as H,i as ce,l as le,m as U,n as ue,r as de,t as fe,u as pe}from"../chunks/GNUylpEb.js";import{n as me,r as he,t as ge}from"../chunks/DBKez944.js";var W=`\x1B`,G=`${W}]8;;`,K=`${W}\\`,q={border:`2`,edge:`36`,edgeLabel:`2;36`,title:`1`},J=(e,t)=>`${t};2;${[1,3,5].map(t=>Number.parseInt(e.slice(t,t+2),16)).join(`;`)}`;function Y(e,t,n){let r=[],i=(t===`border`?e.stroke??e.color:t===`edge`?void 0:e.color)??(e.fill===void 0?void 0:H(e.fill));return i!==void 0&&r.push(J(i,38)),e.fill!==void 0&&r.push(J(e.fill,48)),r.length===0&&n!==void 0&&r.push(n),e.bold===!0&&r.unshift(`1`),r.length>0?r.join(`;`):void 0}function _e(e,t=q){return e.styled.map(n=>n.map(n=>{let r=V(n.classes,e.classDefs),i=r===null?t[n.role]:Y(r,n.role,t[n.role]),a=i===void 0?n.text:`${W}[${i}m${n.text}${W}[0m`;return n.href===void 0?a:`${G}${n.href}${K}${a}${G}${K}`}).join(``))}function ve(e,t){e=z(e);let n=` mermaid: ${e.split(/\s+/).filter(e=>e!==``)[0]??`diagram`} `,r=t===void 0?void 0:Math.max(8,B(t,4)),i=R(e).map(e=>ye(e).replace(/\s+$/,``)).reduce((e,t)=>!e.started&&t===``?e:(e.started=!0,e.lines.push(...X(t,r)),e),{started:!1,lines:[]}).lines,a=i.reduce((e,t)=>Math.max(e,L(t)),L(n)),o=a+2,s=[],c=[],l=`─`.repeat(B(o,L(n)));s.push(`╭${n}${l}╮`),c.push([{text:`╭`,role:`border`},{text:n,role:`title`},{text:`${l}╮`,role:`border`}]);for(let e of i){let t=` `.repeat(B(a,L(e)));s.push(`│ ${e}${t} │`),c.push([{text:`│ `,role:`border`},{text:e,role:`text`},{text:`${t} │`,role:`border`}])}let u=`╰${`─`.repeat(o)}╯`;return s.push(u),c.push([{text:u,role:`border`}]),{plain:s,styled:c,width:o+2,classDefs:{},warnings:[]}}function ye(e){if(!e.includes(`	`))return e;let t=``,n=0;for(let[r,i]of I(e))if(r===`	`){let e=4-n%4;t+=` `.repeat(e),n+=e}else t+=r,n+=i;return t}function X(e,t){if(t===void 0||L(e)<=t)return[e];let n=[],r=``,i=0;for(let[a,o]of I(e))i+o>t&&r!==``&&(n.push(r),r=``,i=0),r+=a,i+=o;return r!==``&&n.push(r),n}function be(e){let t=document.createElement(`canvas`).getContext(`2d`);if(!t)return null;let n=t.font;if(t.font=`100px ${e}`,t.font===n)return null;let r=t.measureText(`M`);if(!(r.width>0))return null;let i=r.fontBoundingBoxAscent,a=r.fontBoundingBoxDescent;return{cellAspect:r.width/100,baseline:i+a>0?Math.min(1,Math.max(.5,i/(i+a))):.8}}var xe=new Set([`$$slots`,`$$events`,`$$legacy`,`text`,`rows`,`cols`,`margin`,`grid`,`frame`,`cellAspect`,`glyphScale`,`cellSize`,`theme`,`customGlyphs`]),Se=t(`<text visibility="hidden" font-size="100" aria-hidden="true">M</text>`),Ce=t(`<rect></rect>`),we=t(`<path fill="none"></path>`),Z=t(`<rect fill="none"></rect>`),Q=t(`<path></path>`),Te=t(`<a><tspan> </tspan></a>`),Ee=t(`<tspan> </tspan>`),De=t(`<text fill="currentColor" xml:space="preserve"></text>`),Oe=t(`<svg><!><!><!><!><!><!></svg>`);function ke(t,n){ne(n,!0);let s=w(n,`text`,3,``),d=w(n,`margin`,3,0),f=w(n,`grid`,3,!1),p=w(n,`frame`,3,!1),h=w(n,`cellAspect`,3,`auto`),ee=w(n,`glyphScale`,3,1),te=w(n,`cellSize`,3,50),T=w(n,`customGlyphs`,3,!0),E=b(n,xe),D=e(void 0),A=e(void 0),F=e(null);c(()=>{if(h()!==`auto`||!o(D)||!o(A))return;let e=o(D),t=new ResizeObserver(()=>{let t=be(getComputedStyle(e).fontFamily);t&&(t.cellAspect!==o(F)?.cellAspect||t.baseline!==o(F)?.baseline)&&v(F,t,!0)});return t.observe(o(A)),()=>t.disconnect()});let ie=x(()=>le(pe(s(),n.theme))),I=x(()=>se(o(ie),{rows:n.rows,cols:n.cols,margin:d(),grid:f(),frame:p(),cellAspect:h()===`auto`?o(F)?.cellAspect:h(),baseline:h()===`auto`?o(F)?.baseline:void 0,glyphScale:ee(),cellSize:te(),customGlyphs:T()})),L=x(()=>n.role??(E[`aria-label`]||E[`aria-labelledby`]?`img`:`presentation`));var R=Oe();j(R,()=>({viewBox:o(I).viewBox,width:o(I).width,height:o(I).height,overflow:`hidden`,preserveAspectRatio:`xMinYMin meet`,xmlns:`http://www.w3.org/2000/svg`,...E,role:o(L),style:`width: 100%; height: 100%; font-family: var(--ascii-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);${n.theme?.foreground?` color: ${n.theme.foreground};`:``}${n.style?` ${n.style}`:``}`}));var z=u(R),B=e=>{var t=Se();k(t,e=>v(A,e),()=>o(A)),i(e,t)};g(z,e=>{h()===`auto`&&e(B)});var ae=l(z);r(ae,17,()=>o(I).rows,P,(e,t)=>{var n=m(),a=O(n);r(a,17,()=>o(t).bgs,P,(e,t)=>{var n=Ce();_(()=>{C(n,o(t).style),S(n,`x`,o(t).x),S(n,`y`,o(t).y),S(n,`width`,o(t).width),S(n,`height`,o(t).height)}),i(e,n)}),i(e,n)});var oe=l(ae),V=e=>{var t=we();_(()=>{y(t,0,N(o(I).grid.class)),S(t,`d`,o(I).grid.d),S(t,`stroke`,o(I).grid.stroke),S(t,`stroke-opacity`,o(I).grid.strokeOpacity),S(t,`stroke-width`,o(I).grid.strokeWidth)}),i(e,t)};g(oe,e=>{o(I).grid&&e(V)});var H=l(oe),ce=e=>{var t=Z();_(()=>{y(t,0,N(o(I).frame.class)),S(t,`x`,o(I).frame.x),S(t,`y`,o(I).frame.y),S(t,`width`,o(I).frame.width),S(t,`height`,o(I).frame.height),S(t,`stroke`,o(I).frame.stroke),S(t,`stroke-width`,o(I).frame.strokeWidth)}),i(e,t)};g(H,e=>{o(I).frame&&e(ce)});var U=l(H);r(U,17,()=>o(I).rows,P,(e,t)=>{var n=m(),a=O(n);r(a,17,()=>o(t).shapes,P,(e,t)=>{var n=Q();_(()=>{C(n,o(t).style),S(n,`d`,o(t).d)}),i(e,n)}),i(e,n)});var ue=l(U);r(ue,17,()=>o(I).rows,P,(e,t)=>{var n=m(),s=O(n),c=e=>{var n=De();r(n,21,()=>o(t).runs,P,(e,t)=>{var n=m(),r=O(n),s=e=>{var n=Te(),r=u(n),s=u(r,!0);M(r),M(n),_(()=>{S(n,`href`,o(t).href),C(r,o(t).style),S(r,`x`,o(t).x),a(s,o(t).text)}),i(e,n)},c=e=>{var n=Ee(),r=u(n,!0);M(n),_(()=>{C(n,o(t).style),S(n,`x`,o(t).x),a(r,o(t).text)}),i(e,n)};g(r,e=>{o(t).href?e(s):e(c,-1)}),i(e,n)}),M(n),_(()=>{S(n,`y`,o(t).y),S(n,`font-size`,o(I).fontSize)}),i(e,n)};g(s,e=>{o(t).runs.length&&e(c)}),i(e,n)}),M(R),k(R,e=>v(D,e),()=>o(D)),i(t,R),re()}var Ae='---\nname: lovely-mermaid\ndescription: Consult before emitting a ```mermaid block.\n---\n\n# Mermaid diagrams\n\n```mermaid fences render as Unicode box-drawing art. Supported types:\n\n- `flowchart` / `graph` — `TD`/`BT`/`LR`/`RL`, `subgraph` nesting, shapes\n  (`[rect]`, `(round)`, `{diamond}`, v2 `A@{shape: cyl, label: "…"}`),\n  `-->` / `-.->` / `==>` links, `o`/`x` end markers, `|edge labels|`.\n- `stateDiagram-v2` — transitions, `[*]`, `<<choice>>`, `id : description`,\n  composite `state X { … }` with `--` regions.\n- `classDiagram` — member compartments, `<<annotations>>`, `~generics~`,\n  all relation arrows, per-end `"cardinalities"`.\n- `erDiagram` — entities, attributes, crow\'s-foot cardinalities, quoted\n  aliases (`c["Credit Card"]`).\n- `sequenceDiagram` — messages, activations (`->>+` / `-->>-`), notes,\n  `loop`/`alt`/`opt`/`par` blocks, `autonumber`.\n- `pie` — drawn as a labelled bar list; `showData` appends raw values.\n- `mindmap` — the indentation tree, drawn with `├──` guides.\n- `timeline` — `period : event : event` rows, `section` headers.\n- `gitGraph` — `commit`/`branch`/`checkout`/`merge` with `id:`/`tag:`,\n  drawn like `git log --graph`, newest on top.\n\nWorks everywhere: YAML frontmatter `title:`, CJK and emoji in labels.\n\nFlowchart, state and class diagrams only: `:::class` tags +\n`classDef name fill:#f96,color:#000` node colors. Flowchart/class only:\n`click A "url"` / `link A "url"` become clickable OSC 8 hyperlinks.\n\nRules of thumb:\n\n- Quote label text containing `:`, `;`, `#` or brackets.\n- Other types (gantt, sankey, quadrant, …) fall back to displaying the block.\n- Terminals are narrow: prefer `TD` for long chains, keep labels short.\n',je=[{name:`flowchart`,desc:`nodes, branches, edge labels`,src:`flowchart TD
  A[Parse source] --> B{Supported?}
  B -->|yes| C[Lay out]
  B -->|no| D[Framed source]
  C --> E[Unicode art]
  D --> E`},{name:`title`,desc:`frontmatter title over the art`,src:`---
title: Deploy pipeline
---
flowchart LR
  Build --> Test
  Test --> Ship
  Ship --> Done`},{name:`shapes`,desc:`v2 @{shape, label} node syntax`,src:`flowchart TD
  S@{shape: start, label: "Boot"} --> D@{shape: cyl, label: "Config DB"}
  D --> Q@{shape: diamond, label: "Valid?"}
  Q -->|yes| P@{shape: stadium, label: "Run app"}
  Q -->|no| E@{shape: dbl-circ, label: "Halt"}`},{name:`subgraph`,desc:`nested titled frames`,src:`flowchart TD
  In[Request] --> R
  subgraph svc [Service]
    R[Router] --> H1[Handler A]
    R --> H2[Handler B]
  end
  H1 --> Out[(Store)]
  H2 --> Out`},{name:`cycles`,desc:`back and skip edges route around`,src:`flowchart TD
  A[Fetch] --> B{OK?}
  B -->|yes| C[Parse]
  B -->|no| R[Backoff]
  R --> A
  C --> D[Render]
  A -.->|cache hit| D`},{name:`pipeline`,desc:`retry loops at several depths`,src:`flowchart TD
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
  notify --> push`},{name:`pipeline-lr`,desc:`the full pipeline sideways: lanes, labels on their lines`,src:`flowchart LR
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
  notify --> push`},{name:`sequence`,desc:`participants, messages, notes`,src:`sequenceDiagram
  participant U as User
  participant T as Terminal
  participant R as Renderer
  U->>T: mermaid source
  T->>R: render()
  R-->>T: unicode art
  T-->>U: pretty boxes`},{name:`activations`,desc:`hot lifelines between +/- marks`,src:`sequenceDiagram
  Client->>+Server: request
  Server->>+DB: query
  DB-->>-Server: rows
  Server-->>-Client: response`},{name:`state`,desc:`transitions, start/end markers`,src:`stateDiagram-v2
  [*] --> Idle
  Idle --> Parsing: source arrives
  Parsing --> Drawing: parse ok
  Parsing --> Framed: parse fails
  Drawing --> [*]
  Framed --> [*]`},{name:`composite`,desc:`nested states and -- regions`,src:`stateDiagram-v2
  [*] --> Idle
  Idle --> Active
  state Active {
    [*] --> Fetching
    Fetching --> Rendering
    Rendering --> Fetching : retry
    --
    Log --> Flush
  }
  Active --> [*]`},{name:`class`,desc:`compartments, members, relations`,src:`classDiagram
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
  MermaidArt "1" --> "*" Span : rows of`},{name:`styles`,desc:`classDef colors, best-effort applied`,src:`flowchart TD
  A[Request]:::hot --> B{Authorized?}
  B -->|yes| C[Serve]:::ok
  B -->|no| D[401 Denied]:::err
  C --> E[(Cache)]
  class E cold
  classDef hot fill:#ff9966,color:#000000
  classDef ok stroke:#22a06b,color:#22a06b
  classDef err fill:#8b0000,color:#ffdddd
  classDef cold fill:lightblue,color:#000000,font-weight:bold`},{name:`state-styles`,desc:`:::class + classDef in state diagrams`,src:`stateDiagram-v2
  [*] --> Healthy
  Healthy --> Degraded : probe fails
  Degraded --> Healthy : recovers
  Degraded --> Down:::alert : timeout
  Down --> [*]
  class Healthy ok
  classDef ok stroke:#22a06b,color:#22a06b
  classDef alert fill:#8b0000,color:#ffdddd,font-weight:bold`},{name:`links`,desc:`click/link → OSC 8 hyperlinks`,src:`flowchart TD
  A[README] --> B{Where?}
  B -->|terminal| C[npm]
  B -->|browser| D[GitHub]
  click C "https://www.npmjs.com/package/lovely-mermaid"
  click D "https://github.com/xl0/lovely-mermaid"`},{name:`er`,desc:`cardinalities at edge ends, aliases`,src:`erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  c["Credit Card"] |o--|| CUSTOMER : pays with`},{name:`mindmap`,desc:`indentation tree with TUI guides`,src:`mindmap
  root((lovely-mermaid))
    Parsing
      Lenient
      Streaming
    Layout
      Sugiyama
      Lanes
    Output
      Roles
      Classes`},{name:`timeline`,desc:`periods and events, sections`,src:`timeline
  title Project history
  section Port
  2026-07 : Byte-faithful port : Differential harness
  section Redesign
  2026-08 : Lenient parsing : Semantic spans
          : New diagram types`},{name:`pie`,desc:`proportions as a bar list`,src:`pie showData title Render targets
  "Terminals" : 62
  "TUIs" : 25
  "CI logs" : 13`},{name:`gitgraph`,desc:`commit lanes, git log --graph style`,src:`gitGraph
  commit id: "scaffold"
  branch feature
  commit id: "parse"
  checkout main
  commit id: "docs"
  merge feature tag: "v1.0"
  commit id: "polish"`},{name:`cjk`,desc:`wide glyphs measured correctly`,src:`flowchart LR
  A[你好世界] --> B[こんにちは]
  B --> C[🚀 Launch]
  C --> D[Done ✅]`},{name:`broken`,desc:`lenient parsing, advisory warnings`,src:`flowchart TD
  A[Start --> B
  C --> `}],Me=T(`<meta name="description" content="Render Mermaid diagrams as Unicode box-drawing art for terminals. No browser, no SVG — a self-contained layout engine that emits text." class="svelte-1uha8ag"/>`),Ne=T(`<span class="dim svelte-1uha8ag"> </span>`),Pe=T(`<span class="err svelte-1uha8ag">render(src) → null</span>`),Fe=T(`<a class="ghost svelte-1uha8ag" target="_blank" rel="noopener">[view]</a>`),Ie=T(`<span class="fit-arrow svelte-1uha8ag">▲ fits</span>`),Le=T(`<span class="vp svelte-1uha8ag"><button> </button><!></span>`),Re=T(`<div class="art svelte-1uha8ag"><!></div>`),ze=T(`<div class="art empty svelte-1uha8ag">⏳ waiting for a diagram…</div>`),Be=T(`<div class="svelte-1uha8ag"> </div>`),Ve=T(`<div class="tool-warnings svelte-1uha8ag"></div>`),He=T(`<button role="option"> </button>`),Ue=T(`<span class="svelte-1uha8ag"> </span>`),We=T(`<div class="overlay svelte-1uha8ag" role="presentation"><div class="skill-box svelte-1uha8ag" role="dialog" aria-modal="true" aria-label="The lovely-mermaid agent skill"><div class="skill-title svelte-1uha8ag"><a href="https://github.com/xl0/lovely-mermaid/blob/master/skills/lovely-mermaid/SKILL.md" class="svelte-1uha8ag">skills/lovely-mermaid/SKILL.md</a> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">[esc]</button></div> <pre class="svelte-1uha8ag"> </pre></div></div>`),Ge=T(`<main class="svelte-1uha8ag"><div class="assistant svelte-1uha8ag"><div class="header-row svelte-1uha8ag"><span class="md-h svelte-1uha8ag"># lovely-mermaid</span> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">skill</button> <a href="https://github.com/xl0/lovely-mermaid" class="svelte-1uha8ag">GitHub</a> <a href="https://www.npmjs.com/package/lovely-mermaid" class="svelte-1uha8ag">npm</a></div> <p class="svelte-1uha8ag">I render Mermaid diagrams as Unicode box-drawing art, for terminals.</p></div> <div class="custom-block svelte-1uha8ag"><div class="custom-label svelte-1uha8ag">theme</div> <p class="dim note svelte-1uha8ag">Spans carry roles, never colors — the consumer maps them to an <code class="svelte-1uha8ag">AnsiTheme</code>. Styling per role regenerates the SGR codes: the exact bytes a
			terminal would get. Defaults are the library's <code class="svelte-1uha8ag">DEFAULT_THEME</code>.</p> <!> <div class="themecode svelte-1uha8ag"><pre class="svelte-1uha8ag"> </pre> <button class="tb-copy svelte-1uha8ag" title="Copy the AnsiTheme literal"> </button></div></div> <div class="tool-block svelte-1uha8ag"><div class="tool-title svelte-1uha8ag"><span class="dot svelte-1uha8ag">⏺</span> <code class="svelte-1uha8ag"> </code> <!> <!> <!> <span class="spacer svelte-1uha8ag"></span> <!> <button class="ghost svelte-1uha8ag"> </button> <span class="cols svelte-1uha8ag"><span class="dim svelte-1uha8ag">viewport</span> <!></span> <button class="ghost svelte-1uha8ag"> </button></div> <!> <!></div> <div class="editor-box svelte-1uha8ag"><span class="editor-title svelte-1uha8ag">Edit me</span> <span class="accent svelte-1uha8ag">❯</span> <textarea wrap="off" spellcheck="false" aria-label="Mermaid source" class="svelte-1uha8ag"></textarea></div> <div class="examples svelte-1uha8ag" role="listbox" aria-label="Example diagrams"></div> <div class="statusline svelte-1uha8ag"><span class="accent svelte-1uha8ag">lovely-mermaid</span> <span class="svelte-1uha8ag"> </span> <!> <span> </span> <span class="spacer svelte-1uha8ag"></span> <span class="dim svelte-1uha8ag">100% text</span></div></main> <!>`,1);function Ke(t,f){ne(f,!0);let m=e(te(je[0].src)),b=e(60),C=e(!0);c(()=>{document.body.classList.toggle(`light`,!o(C))});let w=e(te(structuredClone(ce.dark)));function T(e){v(C,e,!0),v(w,structuredClone(ce[e?`dark`:`light`]),!0)}let k=e(!1),j=e(!1),N=x(()=>ue.map(e=>[e,oe(o(w)[e])]).filter(([,e])=>e!==null)),I=x(()=>Object.fromEntries(o(N))),L=x(()=>({palette:fe,foreground:de[o(C)?`dark`:`light`].fg,background:de[o(C)?`dark`:`light`].bg})),R=x(()=>o(N).length===0?`const theme: AnsiTheme = {};`:`const theme: AnsiTheme = {\n${o(N).map(([e,t])=>`\t${e}: '${t}',`).join(`
`)}\n};`);async function z(){await navigator.clipboard.writeText(o(R)),v(j,!0),setTimeout(()=>v(j,!1),1200)}let B=e(null),se=``;function V(e=!1){o(B)!==null&&(clearInterval(o(B)),v(B,null),e&&v(m,se,!0))}function H(){if(o(B)!==null){V(!0);return}se=o(m);let e=[...o(m)],t=0;v(m,``),v(B,setInterval(()=>{t=Math.min(t+2,e.length),v(m,e.slice(0,t).join(``),!0),t>=e.length&&V()},40),!0)}async function le(e){V();let t=document.documentElement.scrollHeight-window.scrollY;v(m,e.src,!0);let n=U(e.src);n!==null&&n.width>o(b)&&v(b,[30,60,120].find(e=>n.width<=e)??1/0,!0),await d(),window.scrollTo({top:document.documentElement.scrollHeight-t})}let pe=location.hash.length>1,W=e(!pe);pe&&he(location.hash.slice(1)).then(e=>v(m,e,!0)).catch(()=>{}).finally(()=>v(W,!0));let G=e(``),K=0;c(()=>{let e=o(m);if(!o(W))return;let t=++K;if(e===``){v(G,``),history.replaceState(null,``,location.pathname);return}me(e).then(e=>{t===K&&(v(G,e,!0),history.replaceState(null,``,`#${e}`))})});let q=x(()=>{let e=performance.now();return{art:o(m).trim()===``?null:U(o(m)),ms:performance.now()-e}}),J=x(()=>o(q).art),Y=x(()=>o(J)!==null&&o(J).width<=o(b)),ye=x(()=>o(J)!==null&&!o(Y)?[30,60,120,1/0].find(e=>e>o(b)&&o(J).width<=e)??null:null),X=x(()=>o(m).trim()===``?null:o(Y)?o(J):ve(o(m),o(b)===1/0?void 0:o(b))),be=x(()=>o(X)===null?`idle`:o(J)===null?`error`:o(Y)?`ok`:`pending`),xe=x(()=>o(J)===null||!o(Y)?o(b)===1/0?`sourceBox(src)`:`sourceBox(src, ${o(b)})`:`render(src)`),Se=x(()=>je.find(e=>e.src===o(m))?.desc??null),Ce=x(()=>o(X)===null?``:_e(o(X),o(I)).join(`
`));async function we(){o(X)&&(await navigator.clipboard.writeText(o(X).plain.join(`
`)),v(k,!0),setTimeout(()=>v(k,!1),1200))}let Z=e(!1),Q=e(!1);c(()=>{document.documentElement.style.overflow=o(Z)?`hidden`:``});async function Te(){await navigator.clipboard.writeText(Ae),v(Q,!0),setTimeout(()=>v(Q,!1),1200)}var Ee=Ge();h(`keydown`,s,e=>{e.key===`Escape`&&v(Z,!1)}),F(`1uha8ag`,e=>{var t=Me();n(()=>{ee.title=`lovely-mermaid — Mermaid diagrams as Unicode art`}),i(e,t)});var De=O(Ee),Oe=u(De),Ke=u(Oe),qe=l(u(Ke),4),Je=u(qe);M(qe);var Ye=l(qe,2);D(4),M(Ke),D(2),M(Oe);var Xe=l(Oe,2),Ze=l(u(Xe),4);ge(Ze,{onreset:()=>T(o(C)),get theme(){return o(w)},set theme(e){v(w,e,!0)}});var Qe=l(Ze,2),$e=u(Qe),et=u($e,!0);M($e);var tt=l($e,2),nt=u(tt,!0);M(tt),M(Qe),M(Xe);var rt=l(Xe,2),it=u(rt),at=l(u(it),2),ot=u(at,!0);M(at);var st=l(at,2),ct=e=>{var t=Ne(),n=u(t);M(t),_(()=>a(n,`· ${o(Se)??``}`)),i(e,t)};g(st,e=>{o(Se)&&e(ct)});var lt=l(st,2),ut=e=>{var t=Ne(),n=u(t);M(t),_(()=>a(n,`art is ${o(J).width??``} cols${o(Y)?``:` > ${o(b)}`}`)),i(e,t)},dt=e=>{var t=Pe();i(e,t)};g(lt,e=>{o(J)?e(ut):o(X)&&e(dt,1)});var ft=l(lt,2),pt=e=>{var t=Ne(),n=u(t);M(t),_(e=>a(n,`${e??``} ms`),[()=>o(q).ms<.05?`<0.1`:o(q).ms.toFixed(1)]),i(e,t)};g(ft,e=>{o(X)&&e(pt)});var mt=l(ft,4),ht=e=>{var t=Fe();_(()=>S(t,`href`,`${ie??``}/render/${o(G)??``}`)),i(e,t)};g(mt,e=>{o(G)!==``&&e(ht)});var $=l(mt,2),gt=u($);M($);var _t=l($,2),vt=l(u(_t),2);r(vt,16,()=>[30,60,120,1/0],e=>e,(e,t)=>{var n=Le(),r=u(n);let s;var c=u(r);M(r);var d=l(r),f=e=>{var t=Ie();i(e,t)};g(d,e=>{o(ye)===t&&e(f)}),M(n),_(()=>{s=y(r,1,`ghost svelte-1uha8ag`,null,s,{active:o(b)===t}),a(c,`[${(t===1/0?`∞`:t)??``}]`)}),p(`click`,r,()=>v(b,t,!0)),i(e,n)}),M(_t);var yt=l(_t,2),bt=u(yt,!0);M(yt),M(it);var xt=l(it,2),St=e=>{var t=Re(),n=u(t);{let e=x(()=>o(b)===1/0?o(X).width:Math.max(o(b),o(X).width));ke(n,{get text(){return o(Ce)},get theme(){return o(L)},get cols(){return o(e)},margin:1,cellSize:15,style:`width: auto; height: auto;`,"aria-label":`Rendered diagram`})}M(t),i(e,t)},Ct=e=>{var t=ze();i(e,t)};g(xt,e=>{o(X)?e(St):e(Ct,-1)});var wt=l(xt,2),Tt=e=>{var t=Ve();r(t,21,()=>o(J).warnings,P,(e,t)=>{var n=Be(),r=u(n);M(n),_(()=>a(r,`⚠ ${o(t)??``}`)),i(e,n)}),M(t),i(e,t)};g(wt,e=>{o(J)&&o(J).warnings.length&&e(Tt)}),M(rt);var Et=l(rt,2),Dt=l(u(Et),4);A(Dt),M(Et);var Ot=l(Et,2);r(Ot,21,()=>je,e=>e.name,(e,t)=>{var n=He();let r;var s=u(n);M(n),_(()=>{r=y(n,1,`example svelte-1uha8ag`,null,r,{active:o(m)===o(t).src}),S(n,`aria-selected`,o(m)===o(t).src),a(s,`/${o(t).name??``}`)}),p(`click`,n,()=>le(o(t))),i(e,n)}),M(Ot);var kt=l(Ot,2),At=l(u(kt),2),jt=u(At,!0);M(At);var Mt=l(At,2),Nt=e=>{var t=Ue(),n=u(t);M(t),_(()=>a(n,`${o(X).width??``}×${o(X).plain.length??``} cells`)),i(e,t)};g(Mt,e=>{o(X)&&e(Nt)});var Pt=l(Mt,2);let Ft;var It=u(Pt);M(Pt),D(4),M(kt),M(De);var Lt=l(De,2),Rt=e=>{var t=We(),n=u(t),r=u(n),s=l(u(r),4),c=u(s,!0);M(s);var d=l(s,2);M(r);var f=l(r,2),m=u(f,!0);M(f),M(n),M(t),_(()=>{a(c,o(Q)?`copied`:`[copy]`),a(m,Ae)}),p(`click`,t,e=>{e.target===e.currentTarget&&v(Z,!1)}),p(`click`,s,Te),p(`click`,d,()=>v(Z,!1)),i(e,t)};g(Lt,e=>{o(Z)&&e(Rt)}),_((e,t,n)=>{a(Je,`[${o(C)?`light`:`dark`}]`),a(et,o(R)),a(nt,o(j)?`[copied]`:`[copy]`),S(rt,`data-state`,o(be)),a(ot,o(xe)),$.disabled=e,a(gt,`[${o(B)===null?`stream`:`stop`}]`),yt.disabled=!o(X),a(bt,o(k)?`copied`:`[copy]`),S(Dt,`rows`,t),a(jt,n),Ft=y(Pt,1,`svelte-1uha8ag`,null,Ft,{warn:o(J)!==null&&o(J).warnings.length>0}),a(It,`⚠ ${o(J)?.warnings.length??0??``}`)},[()=>o(m).trim()===``&&o(B)===null,()=>Math.max(2,o(m).split(`
`).length),()=>ae(o(m))??`unknown`]),p(`click`,qe,()=>T(!o(C))),p(`click`,Ye,e=>{e.stopPropagation(),v(Z,!0)}),p(`click`,tt,z),p(`click`,$,H),p(`click`,yt,we),p(`input`,Dt,()=>V()),E(Dt,()=>o(m),e=>v(m,e)),i(t,Ee),re()}f([`click`,`input`]);export{Ke as component};