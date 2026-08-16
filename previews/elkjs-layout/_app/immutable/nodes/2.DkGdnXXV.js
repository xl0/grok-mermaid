import{A as e,B as t,C as n,E as r,F as i,G as a,H as o,I as s,J as c,K as l,L as u,N as ee,O as d,Q as te,S as f,T as p,U as m,V as h,W as ne,Z as re,a as g,b as _,c as ie,d as v,et as y,f as b,h as x,i as S,j as C,k as w,l as ae,m as T,o as E,p as D,q as O,tt as k,w as A,x as j,y as M,z as N}from"../chunks/J-m4JCQB.js";import{s as oe}from"../chunks/BFKtXzUC.js";import"../chunks/xihTtKlq.js";import{B as P,L as se,R as F,T as I,V as L}from"../chunks/DZKFMJzU.js";import{_ as R,a as z,b as ce,c as le,d as ue,f as B,i as de,l as fe,n as pe,o as me,p as he,r as ge,t as _e,v as ve,y as ye}from"../chunks/_cz2GtnV.js";var V=`\x1B`,H=`${V}]8;;`,U=`${V}\\`,W={border:`2`,edge:`36`,edgeLabel:`2;36`,title:`1`},G=(e,t)=>`${t};2;${[1,3,5].map(t=>Number.parseInt(e.slice(t,t+2),16)).join(`;`)}`;function K(e,t,n){let r=[],i=(t===`border`?e.stroke??e.color:t===`edge`?void 0:e.color)??(e.fill===void 0?void 0:ve(e.fill));return i!==void 0&&r.push(G(i,38)),e.fill!==void 0&&r.push(G(e.fill,48)),r.length===0&&n!==void 0&&r.push(n),e.bold===!0&&r.unshift(`1`),r.length>0?r.join(`;`):void 0}function be(e,t=W){return e.styled.map(n=>n.map(n=>{let r=ye(n.classes,e.classDefs),i=r===null?t[n.role]:K(r,n.role,t[n.role]),a=i===void 0?n.text:`${V}[${i}m${n.text}${V}[0m`;return n.href===void 0?a:`${H}${n.href}${U}${a}${H}${U}`}).join(``))}function xe(e,t){e=F(e);let n=` mermaid: ${e.split(/\s+/).filter(e=>e!==``)[0]??`diagram`} `,r=t===void 0?void 0:Math.max(8,I(t,4)),i=se(e).map(e=>Se(e).replace(/\s+$/,``)).reduce((e,t)=>!e.started&&t===``?e:(e.started=!0,e.lines.push(...q(t,r)),e),{started:!1,lines:[]}).lines,a=i.reduce((e,t)=>Math.max(e,L(t)),L(n)),o=a+2,s=[],c=[],l=`─`.repeat(I(o,L(n)));s.push(`╭${n}${l}╮`),c.push([{text:`╭`,role:`border`},{text:n,role:`title`},{text:`${l}╮`,role:`border`}]);for(let e of i){let t=` `.repeat(I(a,L(e)));s.push(`│ ${e}${t} │`),c.push([{text:`│ `,role:`border`},{text:e,role:`text`},{text:`${t} │`,role:`border`}])}let u=`╰${`─`.repeat(o)}╯`;return s.push(u),c.push([{text:u,role:`border`}]),{plain:s,styled:c,width:o+2,classDefs:{},warnings:[]}}function Se(e){if(!e.includes(`	`))return e;let t=``,n=0;for(let[r,i]of P(e))if(r===`	`){let e=4-n%4;t+=` `.repeat(e),n+=e}else t+=r,n+=i;return t}function q(e,t){if(t===void 0||L(e)<=t)return[e];let n=[],r=``,i=0;for(let[a,o]of P(e))i+o>t&&r!==``&&(n.push(r),r=``,i=0),r+=a,i+=o;return r!==``&&n.push(r),n}function Ce(e){let t=document.createElement(`canvas`).getContext(`2d`);if(!t)return null;let n=t.font;if(t.font=`100px ${e}`,t.font===n)return null;let r=t.measureText(`M`);if(!(r.width>0))return null;let i=r.fontBoundingBoxAscent,a=r.fontBoundingBoxDescent;return{cellAspect:r.width/100,baseline:i+a>0?Math.min(1,Math.max(.5,i/(i+a))):.8}}var we=new Set([`$$slots`,`$$events`,`$$legacy`,`text`,`rows`,`cols`,`margin`,`grid`,`frame`,`cellAspect`,`glyphScale`,`cellSize`,`theme`,`customGlyphs`]),Te=r(`<text visibility="hidden" font-size="100" aria-hidden="true">M</text>`),Ee=r(`<rect></rect>`),De=r(`<path fill="none"></path>`),J=r(`<rect fill="none"></rect>`),Y=r(`<path></path>`),Oe=r(`<a><tspan> </tspan></a>`),ke=r(`<tspan> </tspan>`),X=r(`<text fill="currentColor" xml:space="preserve"></text>`),Z=r(`<svg><!><!><!><!><!><!></svg>`);function Ae(e,t){te(t,!0);let r=S(t,`text`,3,``),i=S(t,`margin`,3,0),c=S(t,`grid`,3,!1),ee=S(t,`frame`,3,!1),d=S(t,`cellAspect`,3,`auto`),p=S(t,`glyphScale`,3,1),ne=S(t,`cellSize`,3,50),ie=S(t,`customGlyphs`,3,!0),y=g(t,we),x=l(void 0),w=l(void 0),N=l(null);u(()=>{if(d()!==`auto`||!C(x)||!C(w))return;let e=C(x),t=new ResizeObserver(()=>{let t=Ce(getComputedStyle(e).fontFamily);t&&(t.cellAspect!==C(N)?.cellAspect||t.baseline!==C(N)?.baseline)&&a(N,t,!0)});return t.observe(C(w)),()=>t.disconnect()});let oe=O(()=>B(he(r(),t.theme))),P=O(()=>ue(C(oe),{rows:t.rows,cols:t.cols,margin:i(),grid:c(),frame:ee(),cellAspect:d()===`auto`?C(N)?.cellAspect:d(),baseline:d()===`auto`?C(N)?.baseline:void 0,glyphScale:p(),cellSize:ne(),customGlyphs:ie()})),se=O(()=>t.role??(y[`aria-label`]||y[`aria-labelledby`]?`img`:`presentation`));var F=Z();ae(F,()=>({viewBox:C(P).viewBox,width:C(P).width,height:C(P).height,overflow:`hidden`,preserveAspectRatio:`xMinYMin meet`,xmlns:`http://www.w3.org/2000/svg`,...y,role:C(se),style:`width: 100%; height: 100%; font-family: var(--ascii-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);${t.theme?.foreground?` color: ${t.theme.foreground};`:``}${t.style?` ${t.style}`:``}`}));var I=h(F),L=e=>{var t=Te();E(t,e=>a(w,e),()=>C(w)),n(e,t)};j(I,e=>{d()===`auto`&&e(L)});var R=m(I);M(R,17,()=>C(P).rows,_,(e,t)=>{var r=A(),i=o(r);M(i,17,()=>C(t).bgs,_,(e,t)=>{var r=Ee();s(()=>{b(r,C(t).style),v(r,`x`,C(t).x),v(r,`y`,C(t).y),v(r,`width`,C(t).width),v(r,`height`,C(t).height)}),n(e,r)}),n(e,r)});var z=m(R),ce=e=>{var t=De();s(()=>{D(t,0,T(C(P).grid.class)),v(t,`d`,C(P).grid.d),v(t,`stroke`,C(P).grid.stroke),v(t,`stroke-opacity`,C(P).grid.strokeOpacity),v(t,`stroke-width`,C(P).grid.strokeWidth)}),n(e,t)};j(z,e=>{C(P).grid&&e(ce)});var le=m(z),de=e=>{var t=J();s(()=>{D(t,0,T(C(P).frame.class)),v(t,`x`,C(P).frame.x),v(t,`y`,C(P).frame.y),v(t,`width`,C(P).frame.width),v(t,`height`,C(P).frame.height),v(t,`stroke`,C(P).frame.stroke),v(t,`stroke-width`,C(P).frame.strokeWidth)}),n(e,t)};j(le,e=>{C(P).frame&&e(de)});var fe=m(le);M(fe,17,()=>C(P).rows,_,(e,t)=>{var r=A(),i=o(r);M(i,17,()=>C(t).shapes,_,(e,t)=>{var r=Y();s(()=>{b(r,C(t).style),v(r,`d`,C(t).d)}),n(e,r)}),n(e,r)});var pe=m(fe);M(pe,17,()=>C(P).rows,_,(e,t)=>{var r=A(),i=o(r),a=e=>{var r=X();M(r,21,()=>C(t).runs,_,(e,t)=>{var r=A(),i=o(r),a=e=>{var r=Oe(),i=h(r),a=h(i,!0);k(i),k(r),s(()=>{v(r,`href`,C(t).href),b(i,C(t).style),v(i,`x`,C(t).x),f(a,C(t).text)}),n(e,r)},c=e=>{var r=ke(),i=h(r,!0);k(r),s(()=>{b(r,C(t).style),v(r,`x`,C(t).x),f(i,C(t).text)}),n(e,r)};j(i,e=>{C(t).href?e(a):e(c,-1)}),n(e,r)}),k(r),s(()=>{v(r,`y`,C(t).y),v(r,`font-size`,C(P).fontSize)}),n(e,r)};j(i,e=>{C(t).runs.length&&e(a)}),n(e,r)}),k(F),E(F,e=>a(x,e),()=>C(x)),n(e,F),re()}var je='---\nname: lovely-mermaid\ndescription: Consult before emitting a ```mermaid block.\n---\n\n# Mermaid diagrams\n\n```mermaid fences render as Unicode box-drawing art. Supported types:\n\n- `flowchart` / `graph` — `TD`/`BT`/`LR`/`RL`, `subgraph` nesting, shapes\n  (`[rect]`, `(round)`, `{diamond}`, v2 `A@{shape: cyl, label: "…"}`),\n  `-->` / `-.->` / `==>` links, `o`/`x` end markers, `|edge labels|`.\n- `stateDiagram-v2` — transitions, `[*]`, `<<choice>>`, `id : description`,\n  composite `state X { … }` with `--` regions.\n- `classDiagram` — member compartments, `<<annotations>>`, `~generics~`,\n  all relation arrows, per-end `"cardinalities"`.\n- `erDiagram` — entities, attributes, crow\'s-foot cardinalities, quoted\n  aliases (`c["Credit Card"]`).\n- `sequenceDiagram` — messages, activations (`->>+` / `-->>-`), notes,\n  `loop`/`alt`/`opt`/`par` blocks, `autonumber`.\n- `pie` — drawn as a labelled bar list; `showData` appends raw values.\n- `mindmap` — the indentation tree, drawn with `├──` guides.\n- `timeline` — `period : event : event` rows, `section` headers.\n- `gitGraph` — `commit`/`branch`/`checkout`/`merge` with `id:`/`tag:`,\n  drawn like `git log --graph`, newest on top.\n\nWorks everywhere: YAML frontmatter `title:`, CJK and emoji in labels.\n\nFlowchart, state and class diagrams only: `:::class` tags +\n`classDef name fill:#f96,color:#000` node colors. Flowchart/class only:\n`click A "url"` / `link A "url"` become clickable OSC 8 hyperlinks.\n\nRules of thumb:\n\n- Quote label text containing `:`, `;`, `#` or brackets.\n- Other types (gantt, sankey, quadrant, …) fall back to displaying the block.\n- Terminals are narrow: prefer `TD` for long chains, keep labels short.\n',Me=[{name:`flowchart`,desc:`nodes, branches, edge labels`,src:`flowchart TD
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
  C --> `}],Ne=p(`<meta name="description" content="Render Mermaid diagrams as Unicode box-drawing art for terminals. No browser, no SVG — a self-contained layout engine that emits text." class="svelte-1uha8ag"/>`),Pe=p(`<span class="dim svelte-1uha8ag"> </span>`),Fe=p(`<span class="err svelte-1uha8ag">render(src) → null</span>`),Ie=p(`<a class="ghost svelte-1uha8ag" target="_blank" rel="noopener">[view]</a>`),Le=p(`<span class="fit-arrow svelte-1uha8ag">▲ fits</span>`),Re=p(`<span class="vp svelte-1uha8ag"><button> </button><!></span>`),ze=p(`<div class="art svelte-1uha8ag"><!></div>`),Be=p(`<div class="art empty svelte-1uha8ag">⏳ waiting for a diagram…</div>`),Ve=p(`<div class="svelte-1uha8ag"> </div>`),He=p(`<div class="tool-warnings svelte-1uha8ag"></div>`),Ue=p(`<button role="option"> </button>`),We=p(`<span class="svelte-1uha8ag"> </span>`),Ge=p(`<div class="overlay svelte-1uha8ag" role="presentation"><div class="skill-box svelte-1uha8ag" role="dialog" aria-modal="true" aria-label="The lovely-mermaid agent skill"><div class="skill-title svelte-1uha8ag"><a href="https://github.com/xl0/lovely-mermaid/blob/master/skills/lovely-mermaid/SKILL.md" class="svelte-1uha8ag">skills/lovely-mermaid/SKILL.md</a> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">[esc]</button></div> <pre class="svelte-1uha8ag"> </pre></div></div>`),Ke=p(`<main class="svelte-1uha8ag"><div class="assistant svelte-1uha8ag"><div class="header-row svelte-1uha8ag"><span class="md-h svelte-1uha8ag"># lovely-mermaid</span> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">skill</button> <a href="https://github.com/xl0/lovely-mermaid" class="svelte-1uha8ag">GitHub</a> <a href="https://www.npmjs.com/package/lovely-mermaid" class="svelte-1uha8ag">npm</a></div> <p class="svelte-1uha8ag">I render Mermaid diagrams as Unicode box-drawing art, for terminals.</p></div> <div class="custom-block svelte-1uha8ag"><div class="custom-label svelte-1uha8ag">theme</div> <p class="dim note svelte-1uha8ag">Spans carry roles, never colors — the consumer maps them to an <code class="svelte-1uha8ag">AnsiTheme</code>. Styling per role regenerates the SGR codes: the exact bytes a
			terminal would get. Defaults are the library's <code class="svelte-1uha8ag">DEFAULT_THEME</code>.</p> <!> <div class="themecode svelte-1uha8ag"><pre class="svelte-1uha8ag"> </pre> <button class="tb-copy svelte-1uha8ag" title="Copy the AnsiTheme literal"> </button></div></div> <div class="tool-block svelte-1uha8ag"><div class="tool-title svelte-1uha8ag"><span class="dot svelte-1uha8ag">⏺</span> <code class="svelte-1uha8ag"> </code> <!> <!> <!> <span class="spacer svelte-1uha8ag"></span> <!> <button class="ghost svelte-1uha8ag"> </button> <span class="cols svelte-1uha8ag"><span class="dim svelte-1uha8ag">viewport</span> <!></span> <button class="ghost svelte-1uha8ag"> </button></div> <!> <!></div> <div class="editor-box svelte-1uha8ag"><span class="editor-title svelte-1uha8ag">Edit me</span> <span class="accent svelte-1uha8ag">❯</span> <textarea wrap="off" spellcheck="false" aria-label="Mermaid source" class="svelte-1uha8ag"></textarea></div> <div class="examples svelte-1uha8ag" role="listbox" aria-label="Example diagrams"></div> <div class="statusline svelte-1uha8ag"><span class="accent svelte-1uha8ag">lovely-mermaid</span> <span class="svelte-1uha8ag"> </span> <!> <span> </span> <span class="spacer svelte-1uha8ag"></span> <span class="dim svelte-1uha8ag">100% text</span></div></main> <!>`,1);function qe(r,d){te(d,!0);let p=l(ne(Me[0].src)),g=l(60),b=l(!0);u(()=>{document.body.classList.toggle(`light`,!C(b))});let S=l(ne(structuredClone(z.dark)));function ae(e){a(b,e,!0),a(S,structuredClone(z[e?`dark`:`light`]),!0)}let T=l(!1),E=l(!1),A=O(()=>ge.map(e=>[e,me(C(S)[e])]).filter(([,e])=>e!==null)),P=O(()=>Object.fromEntries(C(A))),se=O(()=>({palette:pe,foreground:de[C(b)?`dark`:`light`].fg,background:de[C(b)?`dark`:`light`].bg})),F=O(()=>C(A).length===0?`const theme: AnsiTheme = {};`:`const theme: AnsiTheme = {\n${C(A).map(([e,t])=>`\t${e}: '${t}',`).join(`
`)}\n};`);async function I(){await navigator.clipboard.writeText(C(F)),a(E,!0),setTimeout(()=>a(E,!1),1200)}let L=l(null),ue=``;function B(e=!1){C(L)!==null&&(clearInterval(C(L)),a(L,null),e&&a(p,ue,!0))}function he(){if(C(L)!==null){B(!0);return}ue=C(p);let e=[...C(p)],t=0;a(p,``),a(L,setInterval(()=>{t=Math.min(t+2,e.length),a(p,e.slice(0,t).join(``),!0),t>=e.length&&B()},40),!0)}async function ve(e){B();let t=document.documentElement.scrollHeight-window.scrollY;a(p,e.src,!0);let n=R(e.src);n!==null&&n.width>C(g)&&a(g,[30,60,120].find(e=>n.width<=e)??1/0,!0),await ee(),window.scrollTo({top:document.documentElement.scrollHeight-t})}let ye=location.hash.length>1,V=l(!ye);ye&&fe(location.hash.slice(1)).then(e=>a(p,e,!0)).catch(()=>{}).finally(()=>a(V,!0));let H=l(``),U=0;u(()=>{let e=C(p);if(!C(V))return;let t=++U;if(e===``){a(H,``),history.replaceState(null,``,location.pathname);return}le(e).then(e=>{t===U&&(a(H,e,!0),history.replaceState(null,``,`#${e}`))})});let W=O(()=>{let e=performance.now();return{art:C(p).trim()===``?null:R(C(p)),ms:performance.now()-e}}),G=O(()=>C(W).art),K=O(()=>C(G)!==null&&C(G).width<=C(g)),Se=O(()=>C(G)!==null&&!C(K)?[30,60,120,1/0].find(e=>e>C(g)&&C(G).width<=e)??null:null),q=O(()=>C(p).trim()===``?null:C(K)?C(G):xe(C(p),C(g)===1/0?void 0:C(g))),Ce=O(()=>C(q)===null?`idle`:C(G)===null?`error`:C(K)?`ok`:`pending`),we=O(()=>C(G)===null||!C(K)?C(g)===1/0?`sourceBox(src)`:`sourceBox(src, ${C(g)})`:`render(src)`),Te=O(()=>Me.find(e=>e.src===C(p))?.desc??null),Ee=O(()=>C(q)===null?``:be(C(q),C(P)).join(`
`));async function De(){C(q)&&(await navigator.clipboard.writeText(C(q).plain.join(`
`)),a(T,!0),setTimeout(()=>a(T,!1),1200))}let J=l(!1),Y=l(!1);u(()=>{document.documentElement.style.overflow=C(J)?`hidden`:``});async function Oe(){await navigator.clipboard.writeText(je),a(Y,!0),setTimeout(()=>a(Y,!1),1200)}var ke=Ke();e(`keydown`,t,e=>{e.key===`Escape`&&a(J,!1)}),x(`1uha8ag`,e=>{var t=Ne();i(()=>{N.title=`lovely-mermaid — Mermaid diagrams as Unicode art`}),n(e,t)});var X=o(ke),Z=h(X),qe=h(Z),Q=m(h(qe),4),Je=h(Q);k(Q);var Ye=m(Q,2);y(4),k(qe),y(2),k(Z);var Xe=m(Z,2),Ze=m(h(Xe),4);_e(Ze,{onreset:()=>ae(C(b)),get theme(){return C(S)},set theme(e){a(S,e,!0)}});var Qe=m(Ze,2),$e=h(Qe),et=h($e,!0);k($e);var tt=m($e,2),nt=h(tt,!0);k(tt),k(Qe),k(Xe);var rt=m(Xe,2),it=h(rt),at=m(h(it),2),ot=h(at,!0);k(at);var st=m(at,2),ct=e=>{var t=Pe(),r=h(t);k(t),s(()=>f(r,`· ${C(Te)??``}`)),n(e,t)};j(st,e=>{C(Te)&&e(ct)});var lt=m(st,2),ut=e=>{var t=Pe(),r=h(t);k(t),s(()=>f(r,`art is ${C(G).width??``} cols${C(K)?``:` > ${C(g)}`}`)),n(e,t)},dt=e=>{var t=Fe();n(e,t)};j(lt,e=>{C(G)?e(ut):C(q)&&e(dt,1)});var ft=m(lt,2),pt=e=>{var t=Pe(),r=h(t);k(t),s(e=>f(r,`${e??``} ms`),[()=>C(W).ms<.05?`<0.1`:C(W).ms.toFixed(1)]),n(e,t)};j(ft,e=>{C(q)&&e(pt)});var mt=m(ft,4),ht=e=>{var t=Ie();s(()=>v(t,`href`,`${oe??``}/render/${C(H)??``}`)),n(e,t)};j(mt,e=>{C(H)!==``&&e(ht)});var $=m(mt,2),gt=h($);k($);var _t=m($,2),vt=m(h(_t),2);M(vt,16,()=>[30,60,120,1/0],e=>e,(e,t)=>{var r=Re(),i=h(r);let o;var c=h(i);k(i);var l=m(i),u=e=>{var t=Le();n(e,t)};j(l,e=>{C(Se)===t&&e(u)}),k(r),s(()=>{o=D(i,1,`ghost svelte-1uha8ag`,null,o,{active:C(g)===t}),f(c,`[${(t===1/0?`∞`:t)??``}]`)}),w(`click`,i,()=>a(g,t,!0)),n(e,r)}),k(_t);var yt=m(_t,2),bt=h(yt,!0);k(yt),k(it);var xt=m(it,2),St=e=>{var t=ze(),r=h(t);{let e=O(()=>C(g)===1/0?C(q).width:Math.max(C(g),C(q).width));Ae(r,{get text(){return C(Ee)},get theme(){return C(se)},get cols(){return C(e)},margin:1,cellSize:15,style:`width: auto; height: auto;`,"aria-label":`Rendered diagram`})}k(t),n(e,t)},Ct=e=>{var t=Be();n(e,t)};j(xt,e=>{C(q)?e(St):e(Ct,-1)});var wt=m(xt,2),Tt=e=>{var t=He();M(t,21,()=>C(G).warnings,_,(e,t)=>{var r=Ve(),i=h(r);k(r),s(()=>f(i,`⚠ ${C(t)??``}`)),n(e,r)}),k(t),n(e,t)};j(wt,e=>{C(G)&&C(G).warnings.length&&e(Tt)}),k(rt);var Et=m(rt,2),Dt=m(h(Et),4);c(Dt),k(Et);var Ot=m(Et,2);M(Ot,21,()=>Me,e=>e.name,(e,t)=>{var r=Ue();let i;var a=h(r);k(r),s(()=>{i=D(r,1,`example svelte-1uha8ag`,null,i,{active:C(p)===C(t).src}),v(r,`aria-selected`,C(p)===C(t).src),f(a,`/${C(t).name??``}`)}),w(`click`,r,()=>ve(C(t))),n(e,r)}),k(Ot);var kt=m(Ot,2),At=m(h(kt),2),jt=h(At,!0);k(At);var Mt=m(At,2),Nt=e=>{var t=We(),r=h(t);k(t),s(()=>f(r,`${C(q).width??``}×${C(q).plain.length??``} cells`)),n(e,t)};j(Mt,e=>{C(q)&&e(Nt)});var Pt=m(Mt,2);let Ft;var It=h(Pt);k(Pt),y(4),k(kt),k(X);var Lt=m(X,2),Rt=e=>{var t=Ge(),r=h(t),i=h(r),o=m(h(i),4),c=h(o,!0);k(o);var l=m(o,2);k(i);var u=m(i,2),ee=h(u,!0);k(u),k(r),k(t),s(()=>{f(c,C(Y)?`copied`:`[copy]`),f(ee,je)}),w(`click`,t,e=>{e.target===e.currentTarget&&a(J,!1)}),w(`click`,o,Oe),w(`click`,l,()=>a(J,!1)),n(e,t)};j(Lt,e=>{C(J)&&e(Rt)}),s((e,t,n)=>{f(Je,`[${C(b)?`light`:`dark`}]`),f(et,C(F)),f(nt,C(E)?`[copied]`:`[copy]`),v(rt,`data-state`,C(Ce)),f(ot,C(we)),$.disabled=e,f(gt,`[${C(L)===null?`stream`:`stop`}]`),yt.disabled=!C(q),f(bt,C(T)?`copied`:`[copy]`),v(Dt,`rows`,t),f(jt,n),Ft=D(Pt,1,`svelte-1uha8ag`,null,Ft,{warn:C(G)!==null&&C(G).warnings.length>0}),f(It,`⚠ ${C(G)?.warnings.length??0??``}`)},[()=>C(p).trim()===``&&C(L)===null,()=>Math.max(2,C(p).split(`
`).length),()=>ce(C(p))??`unknown`]),w(`click`,Q,()=>ae(!C(b))),w(`click`,Ye,e=>{e.stopPropagation(),a(J,!0)}),w(`click`,tt,I),w(`click`,$,he),w(`click`,yt,De),w(`input`,Dt,()=>B()),ie(Dt,()=>C(p),e=>a(p,e)),n(r,ke),re()}d([`click`,`input`]);export{qe as component};