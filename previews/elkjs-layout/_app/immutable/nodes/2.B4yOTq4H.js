import{A as e,B as t,C as n,E as r,F as i,G as a,H as o,I as s,J as c,K as l,L as u,N as ee,O as d,Q as te,S as f,T as p,U as m,V as h,W as ne,Z as re,a as g,b as _,c as ie,d as v,et as y,f as b,h as x,i as S,j as C,k as w,l as ae,m as T,o as E,p as D,q as O,tt as k,w as A,x as j,y as M,z as N}from"../chunks/J-m4JCQB.js";import{s as oe}from"../chunks/DM5nJMrc.js";import"../chunks/xihTtKlq.js";import{E as P,H as F,R as I,V as L,z as R}from"../chunks/CyAWKLih.js";import{_ as z,a as B,b as se,c as ce,d as le,f as V,i as ue,l as de,n as fe,o as pe,p as me,r as he,t as ge,v as _e,y as ve}from"../chunks/7_iGmhSF.js";var H=`\x1B`,U=`${H}]8;;`,W=`${H}\\`,G={border:`2`,edge:`36`,edgeLabel:`2;36`,title:`1`},K=(e,t)=>`${t};2;${[1,3,5].map(t=>Number.parseInt(e.slice(t,t+2),16)).join(`;`)}`;function q(e,t,n){let r=[],i=(t===`border`?e.stroke??e.color:t===`edge`?void 0:e.color)??(e.fill===void 0?void 0:_e(e.fill));return i!==void 0&&r.push(K(i,38)),e.fill!==void 0&&r.push(K(e.fill,48)),r.length===0&&n!==void 0&&r.push(n),e.bold===!0&&r.unshift(`1`),r.length>0?r.join(`;`):void 0}function ye(e,t=G){return e.styled.map(n=>n.map(n=>{let r=ve(n.classes,e.classDefs),i=r===null?t[n.role]:q(r,n.role,t[n.role]),a=i===void 0?n.text:`${H}[${i}m${n.text}${H}[0m`;return n.href===void 0?a:`${U}${n.href}${W}${a}${U}${W}`}).join(``))}function be(e,t){e=R(e);let n=` mermaid: ${e.split(/\s+/).filter(e=>e!==``)[0]??`diagram`} `,r=t===void 0?void 0:Math.max(8,P(t,4)),i=I(e).map(e=>xe(e).replace(/\s+$/,``)).reduce((e,t)=>!e.started&&t===``?e:(e.started=!0,e.lines.push(...J(t,r)),e),{started:!1,lines:[]}).lines,a=i.reduce((e,t)=>Math.max(e,F(t)),F(n)),o=a+2,s=[],c=[],l=`─`.repeat(P(o,F(n)));s.push(`╭${n}${l}╮`),c.push([{text:`╭`,role:`border`},{text:n,role:`title`},{text:`${l}╮`,role:`border`}]);for(let e of i){let t=` `.repeat(P(a,F(e)));s.push(`│ ${e}${t} │`),c.push([{text:`│ `,role:`border`},{text:e,role:`text`},{text:`${t} │`,role:`border`}])}let u=`╰${`─`.repeat(o)}╯`;return s.push(u),c.push([{text:u,role:`border`}]),{plain:s,styled:c,width:o+2,classDefs:{},warnings:[]}}function xe(e){if(!e.includes(`	`))return e;let t=``,n=0;for(let[r,i]of L(e))if(r===`	`){let e=4-n%4;t+=` `.repeat(e),n+=e}else t+=r,n+=i;return t}function J(e,t){if(t===void 0||F(e)<=t)return[e];let n=[],r=``,i=0;for(let[a,o]of L(e))i+o>t&&r!==``&&(n.push(r),r=``,i=0),r+=a,i+=o;return r!==``&&n.push(r),n}function Se(e){let t=document.createElement(`canvas`).getContext(`2d`);if(!t)return null;let n=t.font;if(t.font=`100px ${e}`,t.font===n)return null;let r=t.measureText(`M`);if(!(r.width>0))return null;let i=r.fontBoundingBoxAscent,a=r.fontBoundingBoxDescent;return{cellAspect:r.width/100,baseline:i+a>0?Math.min(1,Math.max(.5,i/(i+a))):.8}}var Ce=new Set([`$$slots`,`$$events`,`$$legacy`,`text`,`rows`,`cols`,`margin`,`grid`,`frame`,`cellAspect`,`glyphScale`,`cellSize`,`theme`,`customGlyphs`]),we=r(`<text visibility="hidden" font-size="100" aria-hidden="true">M</text>`),Te=r(`<rect></rect>`),Ee=r(`<path fill="none"></path>`),Y=r(`<rect fill="none"></rect>`),X=r(`<path></path>`),De=r(`<a><tspan> </tspan></a>`),Oe=r(`<tspan> </tspan>`),Z=r(`<text fill="currentColor" xml:space="preserve"></text>`),Q=r(`<svg><!><!><!><!><!><!></svg>`);function ke(e,t){te(t,!0);let r=S(t,`text`,3,``),i=S(t,`margin`,3,0),c=S(t,`grid`,3,!1),ee=S(t,`frame`,3,!1),d=S(t,`cellAspect`,3,`auto`),p=S(t,`glyphScale`,3,1),ne=S(t,`cellSize`,3,50),ie=S(t,`customGlyphs`,3,!0),y=g(t,Ce),x=l(void 0),w=l(void 0),N=l(null);u(()=>{if(d()!==`auto`||!C(x)||!C(w))return;let e=C(x),t=new ResizeObserver(()=>{let t=Se(getComputedStyle(e).fontFamily);t&&(t.cellAspect!==C(N)?.cellAspect||t.baseline!==C(N)?.baseline)&&a(N,t,!0)});return t.observe(C(w)),()=>t.disconnect()});let oe=O(()=>V(me(r(),t.theme))),P=O(()=>le(C(oe),{rows:t.rows,cols:t.cols,margin:i(),grid:c(),frame:ee(),cellAspect:d()===`auto`?C(N)?.cellAspect:d(),baseline:d()===`auto`?C(N)?.baseline:void 0,glyphScale:p(),cellSize:ne(),customGlyphs:ie()})),F=O(()=>t.role??(y[`aria-label`]||y[`aria-labelledby`]?`img`:`presentation`));var I=Q();ae(I,()=>({viewBox:C(P).viewBox,width:C(P).width,height:C(P).height,overflow:`hidden`,preserveAspectRatio:`xMinYMin meet`,xmlns:`http://www.w3.org/2000/svg`,...y,role:C(F),style:`width: 100%; height: 100%; font-family: var(--ascii-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);${t.theme?.foreground?` color: ${t.theme.foreground};`:``}${t.style?` ${t.style}`:``}`}));var L=h(I),R=e=>{var t=we();E(t,e=>a(w,e),()=>C(w)),n(e,t)};j(L,e=>{d()===`auto`&&e(R)});var z=m(L);M(z,17,()=>C(P).rows,_,(e,t)=>{var r=A(),i=o(r);M(i,17,()=>C(t).bgs,_,(e,t)=>{var r=Te();s(()=>{b(r,C(t).style),v(r,`x`,C(t).x),v(r,`y`,C(t).y),v(r,`width`,C(t).width),v(r,`height`,C(t).height)}),n(e,r)}),n(e,r)});var B=m(z),se=e=>{var t=Ee();s(()=>{D(t,0,T(C(P).grid.class)),v(t,`d`,C(P).grid.d),v(t,`stroke`,C(P).grid.stroke),v(t,`stroke-opacity`,C(P).grid.strokeOpacity),v(t,`stroke-width`,C(P).grid.strokeWidth)}),n(e,t)};j(B,e=>{C(P).grid&&e(se)});var ce=m(B),ue=e=>{var t=Y();s(()=>{D(t,0,T(C(P).frame.class)),v(t,`x`,C(P).frame.x),v(t,`y`,C(P).frame.y),v(t,`width`,C(P).frame.width),v(t,`height`,C(P).frame.height),v(t,`stroke`,C(P).frame.stroke),v(t,`stroke-width`,C(P).frame.strokeWidth)}),n(e,t)};j(ce,e=>{C(P).frame&&e(ue)});var de=m(ce);M(de,17,()=>C(P).rows,_,(e,t)=>{var r=A(),i=o(r);M(i,17,()=>C(t).shapes,_,(e,t)=>{var r=X();s(()=>{b(r,C(t).style),v(r,`d`,C(t).d)}),n(e,r)}),n(e,r)});var fe=m(de);M(fe,17,()=>C(P).rows,_,(e,t)=>{var r=A(),i=o(r),a=e=>{var r=Z();M(r,21,()=>C(t).runs,_,(e,t)=>{var r=A(),i=o(r),a=e=>{var r=De(),i=h(r),a=h(i,!0);k(i),k(r),s(()=>{v(r,`href`,C(t).href),b(i,C(t).style),v(i,`x`,C(t).x),f(a,C(t).text)}),n(e,r)},c=e=>{var r=Oe(),i=h(r,!0);k(r),s(()=>{b(r,C(t).style),v(r,`x`,C(t).x),f(i,C(t).text)}),n(e,r)};j(i,e=>{C(t).href?e(a):e(c,-1)}),n(e,r)}),k(r),s(()=>{v(r,`y`,C(t).y),v(r,`font-size`,C(P).fontSize)}),n(e,r)};j(i,e=>{C(t).runs.length&&e(a)}),n(e,r)}),k(I),E(I,e=>a(x,e),()=>C(x)),n(e,I),re()}var Ae='---\nname: lovely-mermaid\ndescription: Consult before emitting a ```mermaid block.\n---\n\n# Mermaid diagrams\n\n```mermaid fences render as Unicode box-drawing art. Supported types:\n\n- `flowchart` / `graph` — `TD`/`BT`/`LR`/`RL`, `subgraph` nesting, shapes\n  (`[rect]`, `(round)`, `{diamond}`, v2 `A@{shape: cyl, label: "…"}`),\n  `-->` / `-.->` / `==>` links, `o`/`x` end markers, `|edge labels|`.\n- `stateDiagram-v2` — transitions, `[*]`, `<<choice>>`, `id : description`,\n  composite `state X { … }` with `--` regions.\n- `classDiagram` — member compartments, `<<annotations>>`, `~generics~`,\n  all relation arrows, per-end `"cardinalities"`.\n- `erDiagram` — entities, attributes, crow\'s-foot cardinalities, quoted\n  aliases (`c["Credit Card"]`).\n- `sequenceDiagram` — messages, activations (`->>+` / `-->>-`), notes,\n  `loop`/`alt`/`opt`/`par` blocks, `autonumber`.\n- `pie` — drawn as a labelled bar list; `showData` appends raw values.\n- `mindmap` — the indentation tree, drawn with `├──` guides.\n- `timeline` — `period : event : event` rows, `section` headers.\n- `gitGraph` — `commit`/`branch`/`checkout`/`merge` with `id:`/`tag:`,\n  drawn like `git log --graph`, newest on top.\n\nWorks everywhere: YAML frontmatter `title:`, CJK and emoji in labels.\n\nFlowchart, state and class diagrams only: `:::class` tags +\n`classDef name fill:#f96,color:#000` node colors. Flowchart/class only:\n`click A "url"` / `link A "url"` become clickable OSC 8 hyperlinks.\n\nRules of thumb:\n\n- Quote label text containing `:`, `;`, `#` or brackets.\n- Other types (gantt, sankey, quadrant, …) fall back to displaying the block.\n- Terminals are narrow: prefer `TD` for long chains, keep labels short.\n',je=[{name:`flowchart`,desc:`nodes, branches, edge labels`,src:`flowchart TD
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
  C --> `}],Me=p(`<meta name="description" content="Render Mermaid diagrams as Unicode box-drawing art for terminals. No browser, no SVG — a self-contained layout engine that emits text." class="svelte-1uha8ag"/>`),Ne=p(`<span class="dim svelte-1uha8ag"> </span>`),Pe=p(`<span class="err svelte-1uha8ag">render(src) → null</span>`),Fe=p(`<a class="ghost svelte-1uha8ag" target="_blank" rel="noopener">[view]</a>`),Ie=p(`<span class="fit-arrow svelte-1uha8ag">▲ fits</span>`),Le=p(`<span class="vp svelte-1uha8ag"><button> </button><!></span>`),Re=p(`<div class="art svelte-1uha8ag"><!></div>`),ze=p(`<div class="art empty svelte-1uha8ag">⏳ waiting for a diagram…</div>`),Be=p(`<div class="svelte-1uha8ag"> </div>`),Ve=p(`<div class="tool-warnings svelte-1uha8ag"></div>`),He=p(`<button role="option"> </button>`),Ue=p(`<span class="svelte-1uha8ag"> </span>`),We=p(`<div class="overlay svelte-1uha8ag" role="presentation"><div class="skill-box svelte-1uha8ag" role="dialog" aria-modal="true" aria-label="The lovely-mermaid agent skill"><div class="skill-title svelte-1uha8ag"><a href="https://github.com/xl0/lovely-mermaid/blob/master/skills/lovely-mermaid/SKILL.md" class="svelte-1uha8ag">skills/lovely-mermaid/SKILL.md</a> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">[esc]</button></div> <pre class="svelte-1uha8ag"> </pre></div></div>`),Ge=p(`<main class="svelte-1uha8ag"><div class="assistant svelte-1uha8ag"><div class="header-row svelte-1uha8ag"><span class="md-h svelte-1uha8ag"># lovely-mermaid</span> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">skill</button> <a href="https://github.com/xl0/lovely-mermaid" class="svelte-1uha8ag">GitHub</a> <a href="https://www.npmjs.com/package/lovely-mermaid" class="svelte-1uha8ag">npm</a></div> <p class="svelte-1uha8ag">I render Mermaid diagrams as Unicode box-drawing art, for terminals.</p></div> <div class="custom-block svelte-1uha8ag"><div class="custom-label svelte-1uha8ag">theme</div> <p class="dim note svelte-1uha8ag">Spans carry roles, never colors — the consumer maps them to an <code class="svelte-1uha8ag">AnsiTheme</code>. Styling per role regenerates the SGR codes: the exact bytes a
			terminal would get. Defaults are the library's <code class="svelte-1uha8ag">DEFAULT_THEME</code>.</p> <!> <div class="themecode svelte-1uha8ag"><pre class="svelte-1uha8ag"> </pre> <button class="tb-copy svelte-1uha8ag" title="Copy the AnsiTheme literal"> </button></div></div> <div class="tool-block svelte-1uha8ag"><div class="tool-title svelte-1uha8ag"><span class="dot svelte-1uha8ag">⏺</span> <code class="svelte-1uha8ag"> </code> <!> <!> <!> <span class="spacer svelte-1uha8ag"></span> <!> <button class="ghost svelte-1uha8ag"> </button> <span class="cols svelte-1uha8ag"><span class="dim svelte-1uha8ag">viewport</span> <!></span> <button class="ghost svelte-1uha8ag"> </button></div> <!> <!></div> <div class="editor-box svelte-1uha8ag"><span class="editor-title svelte-1uha8ag">Edit me</span> <span class="accent svelte-1uha8ag">❯</span> <textarea wrap="off" spellcheck="false" aria-label="Mermaid source" class="svelte-1uha8ag"></textarea></div> <div class="examples svelte-1uha8ag" role="listbox" aria-label="Example diagrams"></div> <div class="statusline svelte-1uha8ag"><span class="accent svelte-1uha8ag">lovely-mermaid</span> <span class="svelte-1uha8ag"> </span> <!> <span> </span> <span class="spacer svelte-1uha8ag"></span> <span class="dim svelte-1uha8ag">100% text</span></div></main> <!>`,1);function Ke(r,d){te(d,!0);let p=l(ne(je[0].src)),g=l(60),b=l(!0);u(()=>{document.body.classList.toggle(`light`,!C(b))});let S=l(ne(structuredClone(B.dark)));function ae(e){a(b,e,!0),a(S,structuredClone(B[e?`dark`:`light`]),!0)}let T=l(!1),E=l(!1),A=O(()=>he.map(e=>[e,pe(C(S)[e])]).filter(([,e])=>e!==null)),P=O(()=>Object.fromEntries(C(A))),F=O(()=>({palette:fe,foreground:ue[C(b)?`dark`:`light`].fg,background:ue[C(b)?`dark`:`light`].bg})),I=O(()=>C(A).length===0?`const theme: AnsiTheme = {};`:`const theme: AnsiTheme = {\n${C(A).map(([e,t])=>`\t${e}: '${t}',`).join(`
`)}\n};`);async function L(){await navigator.clipboard.writeText(C(I)),a(E,!0),setTimeout(()=>a(E,!1),1200)}let R=l(null),le=``;function V(e=!1){C(R)!==null&&(clearInterval(C(R)),a(R,null),e&&a(p,le,!0))}function me(){if(C(R)!==null){V(!0);return}le=C(p);let e=[...C(p)],t=0;a(p,``),a(R,setInterval(()=>{t=Math.min(t+2,e.length),a(p,e.slice(0,t).join(``),!0),t>=e.length&&V()},40),!0)}async function _e(e){V();let t=document.documentElement.scrollHeight-window.scrollY;a(p,e.src,!0);let n=z(e.src);n!==null&&n.width>C(g)&&a(g,[30,60,120].find(e=>n.width<=e)??1/0,!0),await ee(),window.scrollTo({top:document.documentElement.scrollHeight-t})}let ve=location.hash.length>1,H=l(!ve);ve&&de(location.hash.slice(1)).then(e=>a(p,e,!0)).catch(()=>{}).finally(()=>a(H,!0));let U=l(``),W=0;u(()=>{let e=C(p);if(!C(H))return;let t=++W;if(e===``){a(U,``),history.replaceState(null,``,location.pathname);return}ce(e).then(e=>{t===W&&(a(U,e,!0),history.replaceState(null,``,`#${e}`))})});let G=O(()=>{let e=performance.now();return{art:C(p).trim()===``?null:z(C(p)),ms:performance.now()-e}}),K=O(()=>C(G).art),q=O(()=>C(K)!==null&&C(K).width<=C(g)),xe=O(()=>C(K)!==null&&!C(q)?[30,60,120,1/0].find(e=>e>C(g)&&C(K).width<=e)??null:null),J=O(()=>C(p).trim()===``?null:C(q)?C(K):be(C(p),C(g)===1/0?void 0:C(g))),Se=O(()=>C(J)===null?`idle`:C(K)===null?`error`:C(q)?`ok`:`pending`),Ce=O(()=>C(K)===null||!C(q)?C(g)===1/0?`sourceBox(src)`:`sourceBox(src, ${C(g)})`:`render(src)`),we=O(()=>je.find(e=>e.src===C(p))?.desc??null),Te=O(()=>C(J)===null?``:ye(C(J),C(P)).join(`
`));async function Ee(){C(J)&&(await navigator.clipboard.writeText(C(J).plain.join(`
`)),a(T,!0),setTimeout(()=>a(T,!1),1200))}let Y=l(!1),X=l(!1);u(()=>{document.documentElement.style.overflow=C(Y)?`hidden`:``});async function De(){await navigator.clipboard.writeText(Ae),a(X,!0),setTimeout(()=>a(X,!1),1200)}var Oe=Ge();e(`keydown`,t,e=>{e.key===`Escape`&&a(Y,!1)}),x(`1uha8ag`,e=>{var t=Me();i(()=>{N.title=`lovely-mermaid — Mermaid diagrams as Unicode art`}),n(e,t)});var Z=o(Oe),Q=h(Z),Ke=h(Q),qe=m(h(Ke),4),Je=h(qe);k(qe);var Ye=m(qe,2);y(4),k(Ke),y(2),k(Q);var Xe=m(Q,2),Ze=m(h(Xe),4);ge(Ze,{onreset:()=>ae(C(b)),get theme(){return C(S)},set theme(e){a(S,e,!0)}});var Qe=m(Ze,2),$e=h(Qe),et=h($e,!0);k($e);var tt=m($e,2),nt=h(tt,!0);k(tt),k(Qe),k(Xe);var rt=m(Xe,2),it=h(rt),at=m(h(it),2),ot=h(at,!0);k(at);var st=m(at,2),ct=e=>{var t=Ne(),r=h(t);k(t),s(()=>f(r,`· ${C(we)??``}`)),n(e,t)};j(st,e=>{C(we)&&e(ct)});var lt=m(st,2),ut=e=>{var t=Ne(),r=h(t);k(t),s(()=>f(r,`art is ${C(K).width??``} cols${C(q)?``:` > ${C(g)}`}`)),n(e,t)},dt=e=>{var t=Pe();n(e,t)};j(lt,e=>{C(K)?e(ut):C(J)&&e(dt,1)});var ft=m(lt,2),pt=e=>{var t=Ne(),r=h(t);k(t),s(e=>f(r,`${e??``} ms`),[()=>C(G).ms<.05?`<0.1`:C(G).ms.toFixed(1)]),n(e,t)};j(ft,e=>{C(J)&&e(pt)});var mt=m(ft,4),ht=e=>{var t=Fe();s(()=>v(t,`href`,`${oe??``}/render/${C(U)??``}`)),n(e,t)};j(mt,e=>{C(U)!==``&&e(ht)});var $=m(mt,2),gt=h($);k($);var _t=m($,2),vt=m(h(_t),2);M(vt,16,()=>[30,60,120,1/0],e=>e,(e,t)=>{var r=Le(),i=h(r);let o;var c=h(i);k(i);var l=m(i),u=e=>{var t=Ie();n(e,t)};j(l,e=>{C(xe)===t&&e(u)}),k(r),s(()=>{o=D(i,1,`ghost svelte-1uha8ag`,null,o,{active:C(g)===t}),f(c,`[${(t===1/0?`∞`:t)??``}]`)}),w(`click`,i,()=>a(g,t,!0)),n(e,r)}),k(_t);var yt=m(_t,2),bt=h(yt,!0);k(yt),k(it);var xt=m(it,2),St=e=>{var t=Re(),r=h(t);{let e=O(()=>C(g)===1/0?C(J).width:Math.max(C(g),C(J).width));ke(r,{get text(){return C(Te)},get theme(){return C(F)},get cols(){return C(e)},margin:1,cellSize:15,style:`width: auto; height: auto;`,"aria-label":`Rendered diagram`})}k(t),n(e,t)},Ct=e=>{var t=ze();n(e,t)};j(xt,e=>{C(J)?e(St):e(Ct,-1)});var wt=m(xt,2),Tt=e=>{var t=Ve();M(t,21,()=>C(K).warnings,_,(e,t)=>{var r=Be(),i=h(r);k(r),s(()=>f(i,`⚠ ${C(t)??``}`)),n(e,r)}),k(t),n(e,t)};j(wt,e=>{C(K)&&C(K).warnings.length&&e(Tt)}),k(rt);var Et=m(rt,2),Dt=m(h(Et),4);c(Dt),k(Et);var Ot=m(Et,2);M(Ot,21,()=>je,e=>e.name,(e,t)=>{var r=He();let i;var a=h(r);k(r),s(()=>{i=D(r,1,`example svelte-1uha8ag`,null,i,{active:C(p)===C(t).src}),v(r,`aria-selected`,C(p)===C(t).src),f(a,`/${C(t).name??``}`)}),w(`click`,r,()=>_e(C(t))),n(e,r)}),k(Ot);var kt=m(Ot,2),At=m(h(kt),2),jt=h(At,!0);k(At);var Mt=m(At,2),Nt=e=>{var t=Ue(),r=h(t);k(t),s(()=>f(r,`${C(J).width??``}×${C(J).plain.length??``} cells`)),n(e,t)};j(Mt,e=>{C(J)&&e(Nt)});var Pt=m(Mt,2);let Ft;var It=h(Pt);k(Pt),y(4),k(kt),k(Z);var Lt=m(Z,2),Rt=e=>{var t=We(),r=h(t),i=h(r),o=m(h(i),4),c=h(o,!0);k(o);var l=m(o,2);k(i);var u=m(i,2),ee=h(u,!0);k(u),k(r),k(t),s(()=>{f(c,C(X)?`copied`:`[copy]`),f(ee,Ae)}),w(`click`,t,e=>{e.target===e.currentTarget&&a(Y,!1)}),w(`click`,o,De),w(`click`,l,()=>a(Y,!1)),n(e,t)};j(Lt,e=>{C(Y)&&e(Rt)}),s((e,t,n)=>{f(Je,`[${C(b)?`light`:`dark`}]`),f(et,C(I)),f(nt,C(E)?`[copied]`:`[copy]`),v(rt,`data-state`,C(Se)),f(ot,C(Ce)),$.disabled=e,f(gt,`[${C(R)===null?`stream`:`stop`}]`),yt.disabled=!C(J),f(bt,C(T)?`copied`:`[copy]`),v(Dt,`rows`,t),f(jt,n),Ft=D(Pt,1,`svelte-1uha8ag`,null,Ft,{warn:C(K)!==null&&C(K).warnings.length>0}),f(It,`⚠ ${C(K)?.warnings.length??0??``}`)},[()=>C(p).trim()===``&&C(R)===null,()=>Math.max(2,C(p).split(`
`).length),()=>se(C(p))??`unknown`]),w(`click`,qe,()=>ae(!C(b))),w(`click`,Ye,e=>{e.stopPropagation(),a(Y,!0)}),w(`click`,tt,L),w(`click`,$,me),w(`click`,yt,Ee),w(`input`,Dt,()=>V()),ie(Dt,()=>C(p),e=>a(p,e)),n(r,Oe),re()}d([`click`,`input`]);export{Ke as component};