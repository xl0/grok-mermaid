import{A as e,B as t,C as n,F as r,G as i,H as a,I as o,J as s,K as c,L as l,N as u,O as d,Q as ee,S as f,T as p,U as m,V as h,W as te,Z as ne,b as re,c as ie,d as g,et as _,h as ae,j as v,k as y,p as b,q as x,tt as S,x as C,y as w,z as oe}from"../chunks/J-m4JCQB.js";import{s as se}from"../chunks/DSeki3UW.js";import"../chunks/xihTtKlq.js";import{B as T,I as E,L as D,w as O,z as k}from"../chunks/BPb2QRwC.js";import{a as ce,c as le,h as ue,i as de,l as fe,m as pe,n as me,o as he,r as ge,t as _e,u as ve,v as ye}from"../chunks/DlOnCosn.js";function be(e,t){e=D(e);let n=` mermaid: ${e.split(/\s+/).filter(e=>e!==``)[0]??`diagram`} `,r=t===void 0?void 0:Math.max(8,O(t,4)),i=E(e).map(e=>A(e).replace(/\s+$/,``)).reduce((e,t)=>!e.started&&t===``?e:(e.started=!0,e.lines.push(...j(t,r)),e),{started:!1,lines:[]}).lines,a=i.reduce((e,t)=>Math.max(e,T(t)),T(n)),o=a+2,s=[],c=[],l=`─`.repeat(O(o,T(n)));s.push(`╭${n}${l}╮`),c.push([{text:`╭`,role:`border`},{text:n,role:`title`},{text:`${l}╮`,role:`border`}]);for(let e of i){let t=` `.repeat(O(a,T(e)));s.push(`│ ${e}${t} │`),c.push([{text:`│ `,role:`border`},{text:e,role:`text`},{text:`${t} │`,role:`border`}])}let u=`╰${`─`.repeat(o)}╯`;return s.push(u),c.push([{text:u,role:`border`}]),{plain:s,styled:c,width:o+2,classDefs:{},warnings:[]}}function A(e){if(!e.includes(`	`))return e;let t=``,n=0;for(let[r,i]of k(e))if(r===`	`){let e=4-n%4;t+=` `.repeat(e),n+=e}else t+=r,n+=i;return t}function j(e,t){if(t===void 0||T(e)<=t)return[e];let n=[],r=``,i=0;for(let[a,o]of k(e))i+o>t&&r!==``&&(n.push(r),r=``,i=0),r+=a,i+=o;return r!==``&&n.push(r),n}var xe='---\nname: lovely-mermaid\ndescription: Consult before emitting a ```mermaid block.\n---\n\n# Mermaid diagrams\n\n```mermaid fences render as Unicode box-drawing art. Supported types:\n\n- `flowchart` / `graph` — `TD`/`BT`/`LR`/`RL`, `subgraph` nesting, shapes\n  (`[rect]`, `(round)`, `{diamond}`, v2 `A@{shape: cyl, label: "…"}`),\n  `-->` / `-.->` / `==>` links, `o`/`x` end markers, `|edge labels|`.\n- `stateDiagram-v2` — transitions, `[*]`, `<<choice>>`, `id : description`,\n  composite `state X { … }` with `--` regions.\n- `classDiagram` — member compartments, `<<annotations>>`, `~generics~`,\n  all relation arrows, per-end `"cardinalities"`.\n- `erDiagram` — entities, attributes, crow\'s-foot cardinalities, quoted\n  aliases (`c["Credit Card"]`).\n- `sequenceDiagram` — messages, activations (`->>+` / `-->>-`), notes,\n  `loop`/`alt`/`opt`/`par` blocks, `autonumber`.\n- `pie` — drawn as a labelled bar list; `showData` appends raw values.\n- `mindmap` — the indentation tree, drawn with `├──` guides.\n- `timeline` — `period : event : event` rows, `section` headers.\n- `gitGraph` — `commit`/`branch`/`checkout`/`merge` with `id:`/`tag:`,\n  drawn like `git log --graph`, newest on top.\n\nWorks everywhere: YAML frontmatter `title:`, CJK and emoji in labels.\n\nFlowchart, state and class diagrams only: `:::class` tags +\n`classDef name fill:#f96,color:#000` node colors. Flowchart/class only:\n`click A "url"` / `link A "url"` become clickable OSC 8 hyperlinks.\n\nRules of thumb:\n\n- Quote label text containing `:`, `;`, `#` or brackets.\n- Other types (gantt, sankey, quadrant, …) fall back to displaying the block.\n- Terminals are narrow: prefer `TD` for long chains, keep labels short.\n',M=[{name:`flowchart`,desc:`nodes, branches, edge labels`,src:`flowchart TD
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
  C --> `}],Se=p(`<meta name="description" content="Render Mermaid diagrams as Unicode box-drawing art for terminals. No browser, no SVG — a self-contained layout engine that emits text." class="svelte-1uha8ag"/>`),N=p(`<span class="dim svelte-1uha8ag"> </span>`),Ce=p(`<span class="err svelte-1uha8ag">render(src) → null</span>`),we=p(`<a class="ghost svelte-1uha8ag" target="_blank" rel="noopener">[view]</a>`),Te=p(`<span class="fit-arrow svelte-1uha8ag">▲ fits</span>`),Ee=p(`<span class="vp svelte-1uha8ag"><button> </button><!></span>`),De=p(`<div class="art svelte-1uha8ag"><!></div>`),Oe=p(`<div class="art empty svelte-1uha8ag">⏳ waiting for a diagram…</div>`),ke=p(`<div class="svelte-1uha8ag"> </div>`),Ae=p(`<div class="tool-warnings svelte-1uha8ag"></div>`),je=p(`<button role="option"> </button>`),Me=p(`<span class="svelte-1uha8ag"> </span>`),Ne=p(`<div class="overlay svelte-1uha8ag" role="presentation"><div class="skill-box svelte-1uha8ag" role="dialog" aria-modal="true" aria-label="The lovely-mermaid agent skill"><div class="skill-title svelte-1uha8ag"><a href="https://github.com/xl0/lovely-mermaid/blob/master/skills/lovely-mermaid/SKILL.md" class="svelte-1uha8ag">skills/lovely-mermaid/SKILL.md</a> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">[esc]</button></div> <pre class="svelte-1uha8ag"> </pre></div></div>`),Pe=p(`<main class="svelte-1uha8ag"><div class="assistant svelte-1uha8ag"><div class="header-row svelte-1uha8ag"><span class="md-h svelte-1uha8ag"># lovely-mermaid</span> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">skill</button> <a href="https://github.com/xl0/lovely-mermaid" class="svelte-1uha8ag">GitHub</a> <a href="https://www.npmjs.com/package/lovely-mermaid" class="svelte-1uha8ag">npm</a></div> <p class="svelte-1uha8ag">I render Mermaid diagrams as Unicode box-drawing art, for terminals.</p></div> <div class="custom-block svelte-1uha8ag"><div class="custom-label svelte-1uha8ag">theme</div> <p class="dim note svelte-1uha8ag">Spans carry roles, never colors — the consumer maps them to an <code class="svelte-1uha8ag">AnsiTheme</code>. Styling per role regenerates the SGR codes: the exact bytes a
			terminal would get. Defaults are the library's <code class="svelte-1uha8ag">DEFAULT_THEME</code>.</p> <!> <div class="themecode svelte-1uha8ag"><pre class="svelte-1uha8ag"> </pre> <button class="tb-copy svelte-1uha8ag" title="Copy the AnsiTheme literal"> </button></div></div> <div class="tool-block svelte-1uha8ag"><div class="tool-title svelte-1uha8ag"><span class="dot svelte-1uha8ag">⏺</span> <code class="svelte-1uha8ag"> </code> <!> <!> <!> <span class="spacer svelte-1uha8ag"></span> <!> <button class="ghost svelte-1uha8ag"> </button> <span class="cols svelte-1uha8ag"><span class="dim svelte-1uha8ag">viewport</span> <!></span> <button class="ghost svelte-1uha8ag"> </button></div> <!> <!></div> <div class="editor-box svelte-1uha8ag"><span class="editor-title svelte-1uha8ag">Edit me</span> <span class="accent svelte-1uha8ag">❯</span> <textarea wrap="off" spellcheck="false" aria-label="Mermaid source" class="svelte-1uha8ag"></textarea></div> <div class="examples svelte-1uha8ag" role="listbox" aria-label="Example diagrams"></div> <div class="statusline svelte-1uha8ag"><span class="accent svelte-1uha8ag">lovely-mermaid</span> <span class="svelte-1uha8ag"> </span> <!> <span> </span> <span class="spacer svelte-1uha8ag"></span> <span class="dim svelte-1uha8ag">100% text</span></div></main> <!>`,1);function P(d,p){ee(p,!0);let T=c(te(M[0].src)),E=c(60),D=c(!0);l(()=>{document.body.classList.toggle(`light`,!v(D))});let O=c(te(structuredClone(ce.dark)));function k(e){i(D,e,!0),i(O,structuredClone(ce[e?`dark`:`light`]),!0)}let A=c(!1),j=c(!1),P=x(()=>ge.map(e=>[e,he(v(O)[e])]).filter(([,e])=>e!==null)),Fe=x(()=>Object.fromEntries(v(P))),Ie=x(()=>({palette:me,foreground:de[v(D)?`dark`:`light`].fg,background:de[v(D)?`dark`:`light`].bg})),Le=x(()=>v(P).length===0?`const theme: AnsiTheme = {};`:`const theme: AnsiTheme = {\n${v(P).map(([e,t])=>`\t${e}: '${t}',`).join(`
`)}\n};`);async function Re(){await navigator.clipboard.writeText(v(Le)),i(j,!0),setTimeout(()=>i(j,!1),1200)}let F=c(null),ze=``;function I(e=!1){v(F)!==null&&(clearInterval(v(F)),i(F,null),e&&i(T,ze,!0))}function Be(){if(v(F)!==null){I(!0);return}ze=v(T);let e=[...v(T)],t=0;i(T,``),i(F,setInterval(()=>{t=Math.min(t+2,e.length),i(T,e.slice(0,t).join(``),!0),t>=e.length&&I()},40),!0)}async function Ve(e){I();let t=document.documentElement.scrollHeight-window.scrollY;i(T,e.src,!0);let n=pe(e.src);n!==null&&n.width>v(E)&&i(E,[30,60,120].find(e=>n.width<=e)??1/0,!0),await u(),window.scrollTo({top:document.documentElement.scrollHeight-t})}let He=location.hash.length>1,Ue=c(!He);He&&fe(location.hash.slice(1)).then(e=>i(T,e,!0)).catch(()=>{}).finally(()=>i(Ue,!0));let L=c(``),We=0;l(()=>{let e=v(T);if(!v(Ue))return;let t=++We;if(e===``){i(L,``),history.replaceState(null,``,location.pathname);return}le(e).then(e=>{t===We&&(i(L,e,!0),history.replaceState(null,``,`#${e}`))})});let R=x(()=>{let e=performance.now();return{art:v(T).trim()===``?null:pe(v(T)),ms:performance.now()-e}}),z=x(()=>v(R).art),B=x(()=>v(z)!==null&&v(z).width<=v(E)),Ge=x(()=>v(z)!==null&&!v(B)?[30,60,120,1/0].find(e=>e>v(E)&&v(z).width<=e)??null:null),V=x(()=>v(T).trim()===``?null:v(B)?v(z):be(v(T),v(E)===1/0?void 0:v(E))),Ke=x(()=>v(V)===null?`idle`:v(z)===null?`error`:v(B)?`ok`:`pending`),qe=x(()=>v(z)===null||!v(B)?v(E)===1/0?`sourceBox(src)`:`sourceBox(src, ${v(E)})`:`render(src)`),Je=x(()=>M.find(e=>e.src===v(T))?.desc??null),Ye=x(()=>v(V)===null?``:ue(v(V),v(Fe)).join(`
`));async function Xe(){v(V)&&(await navigator.clipboard.writeText(v(V).plain.join(`
`)),i(A,!0),setTimeout(()=>i(A,!1),1200))}let H=c(!1),U=c(!1);l(()=>{document.documentElement.style.overflow=v(H)?`hidden`:``});async function Ze(){await navigator.clipboard.writeText(xe),i(U,!0),setTimeout(()=>i(U,!1),1200)}var Qe=Pe();e(`keydown`,t,e=>{e.key===`Escape`&&i(H,!1)}),ae(`1uha8ag`,e=>{var t=Se();r(()=>{oe.title=`lovely-mermaid — Mermaid diagrams as Unicode art`}),n(e,t)});var W=a(Qe),G=h(W),$e=h(G),K=m(h($e),4),et=h(K);S(K);var tt=m(K,2);_(4),S($e),_(2),S(G);var q=m(G,2),nt=m(h(q),4);_e(nt,{onreset:()=>k(v(D)),get theme(){return v(O)},set theme(e){i(O,e,!0)}});var rt=m(nt,2),J=h(rt),it=h(J,!0);S(J);var Y=m(J,2),at=h(Y,!0);S(Y),S(rt),S(q);var X=m(q,2),ot=h(X),st=m(h(ot),2),ct=h(st,!0);S(st);var lt=m(st,2),ut=e=>{var t=N(),r=h(t);S(t),o(()=>f(r,`· ${v(Je)??``}`)),n(e,t)};C(lt,e=>{v(Je)&&e(ut)});var dt=m(lt,2),ft=e=>{var t=N(),r=h(t);S(t),o(()=>f(r,`art is ${v(z).width??``} cols${v(B)?``:` > ${v(E)}`}`)),n(e,t)},pt=e=>{var t=Ce();n(e,t)};C(dt,e=>{v(z)?e(ft):v(V)&&e(pt,1)});var mt=m(dt,2),ht=e=>{var t=N(),r=h(t);S(t),o(e=>f(r,`${e??``} ms`),[()=>v(R).ms<.05?`<0.1`:v(R).ms.toFixed(1)]),n(e,t)};C(mt,e=>{v(V)&&e(ht)});var gt=m(mt,4),_t=e=>{var t=we();o(()=>g(t,`href`,`${se??``}/render/${v(L)??``}`)),n(e,t)};C(gt,e=>{v(L)!==``&&e(_t)});var Z=m(gt,2),vt=h(Z);S(Z);var yt=m(Z,2),bt=m(h(yt),2);w(bt,16,()=>[30,60,120,1/0],e=>e,(e,t)=>{var r=Ee(),a=h(r);let s;var c=h(a);S(a);var l=m(a),u=e=>{var t=Te();n(e,t)};C(l,e=>{v(Ge)===t&&e(u)}),S(r),o(()=>{s=b(a,1,`ghost svelte-1uha8ag`,null,s,{active:v(E)===t}),f(c,`[${(t===1/0?`∞`:t)??``}]`)}),y(`click`,a,()=>i(E,t,!0)),n(e,r)}),S(yt);var Q=m(yt,2),xt=h(Q,!0);S(Q),S(ot);var St=m(ot,2),Ct=e=>{var t=De(),r=h(t);{let e=x(()=>v(E)===1/0?v(V).width:Math.max(v(E),v(V).width));ve(r,{get text(){return v(Ye)},get theme(){return v(Ie)},get cols(){return v(e)},margin:1,cellSize:15,style:`width: auto; height: auto;`,"aria-label":`Rendered diagram`})}S(t),n(e,t)},wt=e=>{var t=Oe();n(e,t)};C(St,e=>{v(V)?e(Ct):e(wt,-1)});var Tt=m(St,2),Et=e=>{var t=Ae();w(t,21,()=>v(z).warnings,re,(e,t)=>{var r=ke(),i=h(r);S(r),o(()=>f(i,`⚠ ${v(t)??``}`)),n(e,r)}),S(t),n(e,t)};C(Tt,e=>{v(z)&&v(z).warnings.length&&e(Et)}),S(X);var Dt=m(X,2),$=m(h(Dt),4);s($),S(Dt);var Ot=m(Dt,2);w(Ot,21,()=>M,e=>e.name,(e,t)=>{var r=je();let i;var a=h(r);S(r),o(()=>{i=b(r,1,`example svelte-1uha8ag`,null,i,{active:v(T)===v(t).src}),g(r,`aria-selected`,v(T)===v(t).src),f(a,`/${v(t).name??``}`)}),y(`click`,r,()=>Ve(v(t))),n(e,r)}),S(Ot);var kt=m(Ot,2),At=m(h(kt),2),jt=h(At,!0);S(At);var Mt=m(At,2),Nt=e=>{var t=Me(),r=h(t);S(t),o(()=>f(r,`${v(V).width??``}×${v(V).plain.length??``} cells`)),n(e,t)};C(Mt,e=>{v(V)&&e(Nt)});var Pt=m(Mt,2);let Ft;var It=h(Pt);S(Pt),_(4),S(kt),S(W);var Lt=m(W,2),Rt=e=>{var t=Ne(),r=h(t),a=h(r),s=m(h(a),4),c=h(s,!0);S(s);var l=m(s,2);S(a);var u=m(a,2),d=h(u,!0);S(u),S(r),S(t),o(()=>{f(c,v(U)?`copied`:`[copy]`),f(d,xe)}),y(`click`,t,e=>{e.target===e.currentTarget&&i(H,!1)}),y(`click`,s,Ze),y(`click`,l,()=>i(H,!1)),n(e,t)};C(Lt,e=>{v(H)&&e(Rt)}),o((e,t,n)=>{f(et,`[${v(D)?`light`:`dark`}]`),f(it,v(Le)),f(at,v(j)?`[copied]`:`[copy]`),g(X,`data-state`,v(Ke)),f(ct,v(qe)),Z.disabled=e,f(vt,`[${v(F)===null?`stream`:`stop`}]`),Q.disabled=!v(V),f(xt,v(A)?`copied`:`[copy]`),g($,`rows`,t),f(jt,n),Ft=b(Pt,1,`svelte-1uha8ag`,null,Ft,{warn:v(z)!==null&&v(z).warnings.length>0}),f(It,`⚠ ${v(z)?.warnings.length??0??``}`)},[()=>v(T).trim()===``&&v(F)===null,()=>Math.max(2,v(T).split(`
`).length),()=>ye(v(T))??`unknown`]),y(`click`,K,()=>k(!v(D))),y(`click`,tt,e=>{e.stopPropagation(),i(H,!0)}),y(`click`,Y,Re),y(`click`,Z,Be),y(`click`,Q,Xe),y(`input`,$,()=>I()),ie($,()=>v(T),e=>i(T,e)),n(d,Qe),ne()}d([`click`,`input`]);export{P as component};