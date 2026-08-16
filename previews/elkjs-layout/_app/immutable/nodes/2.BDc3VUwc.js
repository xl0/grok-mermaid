import{A as e,B as t,C as n,F as r,G as i,H as a,I as o,J as s,K as c,L as l,N as u,O as d,Q as ee,S as f,T as p,U as m,V as h,W as te,Z as ne,b as re,c as ie,d as g,et as _,h as ae,j as v,k as y,p as b,q as x,tt as S,x as C,y as oe,z as se}from"../chunks/J-m4JCQB.js";import{s as ce}from"../chunks/B5Nx7_rb.js";import"../chunks/xihTtKlq.js";import{B as w,L as T,R as E,T as D,V as O}from"../chunks/lVAwsFxM.js";import{a as le,c as ue,h as de,i as fe,l as pe,m as me,n as he,o as ge,r as _e,t as ve,u as ye,v as be}from"../chunks/DRhEoQO-.js";function xe(e,t){e=E(e);let n=` mermaid: ${e.split(/\s+/).filter(e=>e!==``)[0]??`diagram`} `,r=t===void 0?void 0:Math.max(8,D(t,4)),i=T(e).map(e=>k(e).replace(/\s+$/,``)).reduce((e,t)=>!e.started&&t===``?e:(e.started=!0,e.lines.push(...A(t,r)),e),{started:!1,lines:[]}).lines,a=i.reduce((e,t)=>Math.max(e,O(t)),O(n)),o=a+2,s=[],c=[],l=`─`.repeat(D(o,O(n)));s.push(`╭${n}${l}╮`),c.push([{text:`╭`,role:`border`},{text:n,role:`title`},{text:`${l}╮`,role:`border`}]);for(let e of i){let t=` `.repeat(D(a,O(e)));s.push(`│ ${e}${t} │`),c.push([{text:`│ `,role:`border`},{text:e,role:`text`},{text:`${t} │`,role:`border`}])}let u=`╰${`─`.repeat(o)}╯`;return s.push(u),c.push([{text:u,role:`border`}]),{plain:s,styled:c,width:o+2,classDefs:{},warnings:[]}}function k(e){if(!e.includes(`	`))return e;let t=``,n=0;for(let[r,i]of w(e))if(r===`	`){let e=4-n%4;t+=` `.repeat(e),n+=e}else t+=r,n+=i;return t}function A(e,t){if(t===void 0||O(e)<=t)return[e];let n=[],r=``,i=0;for(let[a,o]of w(e))i+o>t&&r!==``&&(n.push(r),r=``,i=0),r+=a,i+=o;return r!==``&&n.push(r),n}var Se='---\nname: lovely-mermaid\ndescription: Consult before emitting a ```mermaid block.\n---\n\n# Mermaid diagrams\n\n```mermaid fences render as Unicode box-drawing art. Supported types:\n\n- `flowchart` / `graph` — `TD`/`BT`/`LR`/`RL`, `subgraph` nesting, shapes\n  (`[rect]`, `(round)`, `{diamond}`, v2 `A@{shape: cyl, label: "…"}`),\n  `-->` / `-.->` / `==>` links, `o`/`x` end markers, `|edge labels|`.\n- `stateDiagram-v2` — transitions, `[*]`, `<<choice>>`, `id : description`,\n  composite `state X { … }` with `--` regions.\n- `classDiagram` — member compartments, `<<annotations>>`, `~generics~`,\n  all relation arrows, per-end `"cardinalities"`.\n- `erDiagram` — entities, attributes, crow\'s-foot cardinalities, quoted\n  aliases (`c["Credit Card"]`).\n- `sequenceDiagram` — messages, activations (`->>+` / `-->>-`), notes,\n  `loop`/`alt`/`opt`/`par` blocks, `autonumber`.\n- `pie` — drawn as a labelled bar list; `showData` appends raw values.\n- `mindmap` — the indentation tree, drawn with `├──` guides.\n- `timeline` — `period : event : event` rows, `section` headers.\n- `gitGraph` — `commit`/`branch`/`checkout`/`merge` with `id:`/`tag:`,\n  drawn like `git log --graph`, newest on top.\n\nWorks everywhere: YAML frontmatter `title:`, CJK and emoji in labels.\n\nFlowchart, state and class diagrams only: `:::class` tags +\n`classDef name fill:#f96,color:#000` node colors. Flowchart/class only:\n`click A "url"` / `link A "url"` become clickable OSC 8 hyperlinks.\n\nRules of thumb:\n\n- Quote label text containing `:`, `;`, `#` or brackets.\n- Other types (gantt, sankey, quadrant, …) fall back to displaying the block.\n- Terminals are narrow: prefer `TD` for long chains, keep labels short.\n',j=[{name:`flowchart`,desc:`nodes, branches, edge labels`,src:`flowchart TD
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
  C --> `}],Ce=p(`<meta name="description" content="Render Mermaid diagrams as Unicode box-drawing art for terminals. No browser, no SVG — a self-contained layout engine that emits text." class="svelte-1uha8ag"/>`),M=p(`<span class="dim svelte-1uha8ag"> </span>`),we=p(`<span class="err svelte-1uha8ag">render(src) → null</span>`),Te=p(`<a class="ghost svelte-1uha8ag" target="_blank" rel="noopener">[view]</a>`),Ee=p(`<span class="fit-arrow svelte-1uha8ag">▲ fits</span>`),De=p(`<span class="vp svelte-1uha8ag"><button> </button><!></span>`),Oe=p(`<div class="art svelte-1uha8ag"><!></div>`),ke=p(`<div class="art empty svelte-1uha8ag">⏳ waiting for a diagram…</div>`),Ae=p(`<div class="svelte-1uha8ag"> </div>`),je=p(`<div class="tool-warnings svelte-1uha8ag"></div>`),Me=p(`<button role="option"> </button>`),Ne=p(`<span class="svelte-1uha8ag"> </span>`),Pe=p(`<div class="overlay svelte-1uha8ag" role="presentation"><div class="skill-box svelte-1uha8ag" role="dialog" aria-modal="true" aria-label="The lovely-mermaid agent skill"><div class="skill-title svelte-1uha8ag"><a href="https://github.com/xl0/lovely-mermaid/blob/master/skills/lovely-mermaid/SKILL.md" class="svelte-1uha8ag">skills/lovely-mermaid/SKILL.md</a> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">[esc]</button></div> <pre class="svelte-1uha8ag"> </pre></div></div>`),Fe=p(`<main class="svelte-1uha8ag"><div class="assistant svelte-1uha8ag"><div class="header-row svelte-1uha8ag"><span class="md-h svelte-1uha8ag"># lovely-mermaid</span> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">skill</button> <a href="https://github.com/xl0/lovely-mermaid" class="svelte-1uha8ag">GitHub</a> <a href="https://www.npmjs.com/package/lovely-mermaid" class="svelte-1uha8ag">npm</a></div> <p class="svelte-1uha8ag">I render Mermaid diagrams as Unicode box-drawing art, for terminals.</p></div> <div class="custom-block svelte-1uha8ag"><div class="custom-label svelte-1uha8ag">theme</div> <p class="dim note svelte-1uha8ag">Spans carry roles, never colors — the consumer maps them to an <code class="svelte-1uha8ag">AnsiTheme</code>. Styling per role regenerates the SGR codes: the exact bytes a
			terminal would get. Defaults are the library's <code class="svelte-1uha8ag">DEFAULT_THEME</code>.</p> <!> <div class="themecode svelte-1uha8ag"><pre class="svelte-1uha8ag"> </pre> <button class="tb-copy svelte-1uha8ag" title="Copy the AnsiTheme literal"> </button></div></div> <div class="tool-block svelte-1uha8ag"><div class="tool-title svelte-1uha8ag"><span class="dot svelte-1uha8ag">⏺</span> <code class="svelte-1uha8ag"> </code> <!> <!> <!> <span class="spacer svelte-1uha8ag"></span> <!> <button class="ghost svelte-1uha8ag"> </button> <span class="cols svelte-1uha8ag"><span class="dim svelte-1uha8ag">viewport</span> <!></span> <button class="ghost svelte-1uha8ag"> </button></div> <!> <!></div> <div class="editor-box svelte-1uha8ag"><span class="editor-title svelte-1uha8ag">Edit me</span> <span class="accent svelte-1uha8ag">❯</span> <textarea wrap="off" spellcheck="false" aria-label="Mermaid source" class="svelte-1uha8ag"></textarea></div> <div class="examples svelte-1uha8ag" role="listbox" aria-label="Example diagrams"></div> <div class="statusline svelte-1uha8ag"><span class="accent svelte-1uha8ag">lovely-mermaid</span> <span class="svelte-1uha8ag"> </span> <!> <span> </span> <span class="spacer svelte-1uha8ag"></span> <span class="dim svelte-1uha8ag">100% text</span></div></main> <!>`,1);function N(d,p){ee(p,!0);let w=c(te(j[0].src)),T=c(60),E=c(!0);l(()=>{document.body.classList.toggle(`light`,!v(E))});let D=c(te(structuredClone(le.dark)));function O(e){i(E,e,!0),i(D,structuredClone(le[e?`dark`:`light`]),!0)}let k=c(!1),A=c(!1),N=x(()=>_e.map(e=>[e,ge(v(D)[e])]).filter(([,e])=>e!==null)),Ie=x(()=>Object.fromEntries(v(N))),Le=x(()=>({palette:he,foreground:fe[v(E)?`dark`:`light`].fg,background:fe[v(E)?`dark`:`light`].bg})),Re=x(()=>v(N).length===0?`const theme: AnsiTheme = {};`:`const theme: AnsiTheme = {\n${v(N).map(([e,t])=>`\t${e}: '${t}',`).join(`
`)}\n};`);async function ze(){await navigator.clipboard.writeText(v(Re)),i(A,!0),setTimeout(()=>i(A,!1),1200)}let P=c(null),Be=``;function F(e=!1){v(P)!==null&&(clearInterval(v(P)),i(P,null),e&&i(w,Be,!0))}function Ve(){if(v(P)!==null){F(!0);return}Be=v(w);let e=[...v(w)],t=0;i(w,``),i(P,setInterval(()=>{t=Math.min(t+2,e.length),i(w,e.slice(0,t).join(``),!0),t>=e.length&&F()},40),!0)}async function He(e){F();let t=document.documentElement.scrollHeight-window.scrollY;i(w,e.src,!0);let n=me(e.src);n!==null&&n.width>v(T)&&i(T,[30,60,120].find(e=>n.width<=e)??1/0,!0),await u(),window.scrollTo({top:document.documentElement.scrollHeight-t})}let Ue=location.hash.length>1,We=c(!Ue);Ue&&pe(location.hash.slice(1)).then(e=>i(w,e,!0)).catch(()=>{}).finally(()=>i(We,!0));let I=c(``),Ge=0;l(()=>{let e=v(w);if(!v(We))return;let t=++Ge;if(e===``){i(I,``),history.replaceState(null,``,location.pathname);return}ue(e).then(e=>{t===Ge&&(i(I,e,!0),history.replaceState(null,``,`#${e}`))})});let L=x(()=>{let e=performance.now();return{art:v(w).trim()===``?null:me(v(w)),ms:performance.now()-e}}),R=x(()=>v(L).art),z=x(()=>v(R)!==null&&v(R).width<=v(T)),Ke=x(()=>v(R)!==null&&!v(z)?[30,60,120,1/0].find(e=>e>v(T)&&v(R).width<=e)??null:null),B=x(()=>v(w).trim()===``?null:v(z)?v(R):xe(v(w),v(T)===1/0?void 0:v(T))),qe=x(()=>v(B)===null?`idle`:v(R)===null?`error`:v(z)?`ok`:`pending`),Je=x(()=>v(R)===null||!v(z)?v(T)===1/0?`sourceBox(src)`:`sourceBox(src, ${v(T)})`:`render(src)`),Ye=x(()=>j.find(e=>e.src===v(w))?.desc??null),Xe=x(()=>v(B)===null?``:de(v(B),v(Ie)).join(`
`));async function Ze(){v(B)&&(await navigator.clipboard.writeText(v(B).plain.join(`
`)),i(k,!0),setTimeout(()=>i(k,!1),1200))}let V=c(!1),H=c(!1);l(()=>{document.documentElement.style.overflow=v(V)?`hidden`:``});async function Qe(){await navigator.clipboard.writeText(Se),i(H,!0),setTimeout(()=>i(H,!1),1200)}var $e=Fe();e(`keydown`,t,e=>{e.key===`Escape`&&i(V,!1)}),ae(`1uha8ag`,e=>{var t=Ce();r(()=>{se.title=`lovely-mermaid — Mermaid diagrams as Unicode art`}),n(e,t)});var U=a($e),W=h(U),et=h(W),G=m(h(et),4),tt=h(G);S(G);var nt=m(G,2);_(4),S(et),_(2),S(W);var K=m(W,2),rt=m(h(K),4);ve(rt,{onreset:()=>O(v(E)),get theme(){return v(D)},set theme(e){i(D,e,!0)}});var it=m(rt,2),q=h(it),at=h(q,!0);S(q);var J=m(q,2),ot=h(J,!0);S(J),S(it),S(K);var Y=m(K,2),X=h(Y),st=m(h(X),2),ct=h(st,!0);S(st);var lt=m(st,2),ut=e=>{var t=M(),r=h(t);S(t),o(()=>f(r,`· ${v(Ye)??``}`)),n(e,t)};C(lt,e=>{v(Ye)&&e(ut)});var dt=m(lt,2),ft=e=>{var t=M(),r=h(t);S(t),o(()=>f(r,`art is ${v(R).width??``} cols${v(z)?``:` > ${v(T)}`}`)),n(e,t)},pt=e=>{var t=we();n(e,t)};C(dt,e=>{v(R)?e(ft):v(B)&&e(pt,1)});var mt=m(dt,2),ht=e=>{var t=M(),r=h(t);S(t),o(e=>f(r,`${e??``} ms`),[()=>v(L).ms<.05?`<0.1`:v(L).ms.toFixed(1)]),n(e,t)};C(mt,e=>{v(B)&&e(ht)});var gt=m(mt,4),_t=e=>{var t=Te();o(()=>g(t,`href`,`${ce??``}/render/${v(I)??``}`)),n(e,t)};C(gt,e=>{v(I)!==``&&e(_t)});var Z=m(gt,2),vt=h(Z);S(Z);var yt=m(Z,2),bt=m(h(yt),2);oe(bt,16,()=>[30,60,120,1/0],e=>e,(e,t)=>{var r=De(),a=h(r);let s;var c=h(a);S(a);var l=m(a),u=e=>{var t=Ee();n(e,t)};C(l,e=>{v(Ke)===t&&e(u)}),S(r),o(()=>{s=b(a,1,`ghost svelte-1uha8ag`,null,s,{active:v(T)===t}),f(c,`[${(t===1/0?`∞`:t)??``}]`)}),y(`click`,a,()=>i(T,t,!0)),n(e,r)}),S(yt);var Q=m(yt,2),xt=h(Q,!0);S(Q),S(X);var St=m(X,2),Ct=e=>{var t=Oe(),r=h(t);{let e=x(()=>v(T)===1/0?v(B).width:Math.max(v(T),v(B).width));ye(r,{get text(){return v(Xe)},get theme(){return v(Le)},get cols(){return v(e)},margin:1,cellSize:15,style:`width: auto; height: auto;`,"aria-label":`Rendered diagram`})}S(t),n(e,t)},wt=e=>{var t=ke();n(e,t)};C(St,e=>{v(B)?e(Ct):e(wt,-1)});var Tt=m(St,2),Et=e=>{var t=je();oe(t,21,()=>v(R).warnings,re,(e,t)=>{var r=Ae(),i=h(r);S(r),o(()=>f(i,`⚠ ${v(t)??``}`)),n(e,r)}),S(t),n(e,t)};C(Tt,e=>{v(R)&&v(R).warnings.length&&e(Et)}),S(Y);var Dt=m(Y,2),$=m(h(Dt),4);s($),S(Dt);var Ot=m(Dt,2);oe(Ot,21,()=>j,e=>e.name,(e,t)=>{var r=Me();let i;var a=h(r);S(r),o(()=>{i=b(r,1,`example svelte-1uha8ag`,null,i,{active:v(w)===v(t).src}),g(r,`aria-selected`,v(w)===v(t).src),f(a,`/${v(t).name??``}`)}),y(`click`,r,()=>He(v(t))),n(e,r)}),S(Ot);var kt=m(Ot,2),At=m(h(kt),2),jt=h(At,!0);S(At);var Mt=m(At,2),Nt=e=>{var t=Ne(),r=h(t);S(t),o(()=>f(r,`${v(B).width??``}×${v(B).plain.length??``} cells`)),n(e,t)};C(Mt,e=>{v(B)&&e(Nt)});var Pt=m(Mt,2);let Ft;var It=h(Pt);S(Pt),_(4),S(kt),S(U);var Lt=m(U,2),Rt=e=>{var t=Pe(),r=h(t),a=h(r),s=m(h(a),4),c=h(s,!0);S(s);var l=m(s,2);S(a);var u=m(a,2),d=h(u,!0);S(u),S(r),S(t),o(()=>{f(c,v(H)?`copied`:`[copy]`),f(d,Se)}),y(`click`,t,e=>{e.target===e.currentTarget&&i(V,!1)}),y(`click`,s,Qe),y(`click`,l,()=>i(V,!1)),n(e,t)};C(Lt,e=>{v(V)&&e(Rt)}),o((e,t,n)=>{f(tt,`[${v(E)?`light`:`dark`}]`),f(at,v(Re)),f(ot,v(A)?`[copied]`:`[copy]`),g(Y,`data-state`,v(qe)),f(ct,v(Je)),Z.disabled=e,f(vt,`[${v(P)===null?`stream`:`stop`}]`),Q.disabled=!v(B),f(xt,v(k)?`copied`:`[copy]`),g($,`rows`,t),f(jt,n),Ft=b(Pt,1,`svelte-1uha8ag`,null,Ft,{warn:v(R)!==null&&v(R).warnings.length>0}),f(It,`⚠ ${v(R)?.warnings.length??0??``}`)},[()=>v(w).trim()===``&&v(P)===null,()=>Math.max(2,v(w).split(`
`).length),()=>be(v(w))??`unknown`]),y(`click`,G,()=>O(!v(E))),y(`click`,nt,e=>{e.stopPropagation(),i(V,!0)}),y(`click`,J,ze),y(`click`,Z,Ve),y(`click`,Q,Ze),y(`input`,$,()=>F()),ie($,()=>v(w),e=>i(w,e)),n(d,$e),ne()}d([`click`,`input`]);export{N as component};