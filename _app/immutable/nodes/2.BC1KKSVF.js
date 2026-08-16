import{$ as e,A as t,B as n,D as r,F as i,G as a,H as o,I as s,K as c,M as l,O as u,P as d,R as f,S as p,U as m,V as ee,W as h,X as te,Z as ne,b as g,c as re,et as _,f as v,k as ie,m as ae,q as oe,u as y,v as b,w as x,x as S,y as se,z as ce}from"../chunks/BF1R68Gy.js";import{s as le}from"../chunks/B4QHnI7g.js";import"../chunks/xihTtKlq.js";import{_ as C,a as ue,b as w,c as de,d as fe,f as pe,g as T,h as me,i as he,l as ge,n as _e,o as ve,r as ye,t as be,u as xe,v as E,y as D}from"../chunks/jnc3OItx.js";function Se(e,t){e=E(e);let n=` mermaid: ${e.split(/\s+/).filter(e=>e!==``)[0]??`diagram`} `,r=t===void 0?void 0:Math.max(8,T(t,4)),i=C(e).map(e=>O(e).replace(/\s+$/,``)).reduce((e,t)=>!e.started&&t===``?e:(e.started=!0,e.lines.push(...k(t,r)),e),{started:!1,lines:[]}).lines,a=i.reduce((e,t)=>Math.max(e,w(t)),w(n)),o=a+2,s=[],c=[],l=`─`.repeat(T(o,w(n)));s.push(`╭${n}${l}╮`),c.push([{text:`╭`,role:`border`},{text:n,role:`title`},{text:`${l}╮`,role:`border`}]);for(let e of i){let t=` `.repeat(T(a,w(e)));s.push(`│ ${e}${t} │`),c.push([{text:`│ `,role:`border`},{text:e,role:`text`},{text:`${t} │`,role:`border`}])}let u=`╰${`─`.repeat(o)}╯`;return s.push(u),c.push([{text:u,role:`border`}]),{plain:s,styled:c,width:o+2,classDefs:{},warnings:[]}}function O(e){if(!e.includes(`	`))return e;let t=``,n=0;for(let[r,i]of D(e))if(r===`	`){let e=4-n%4;t+=` `.repeat(e),n+=e}else t+=r,n+=i;return t}function k(e,t){if(t===void 0||w(e)<=t)return[e];let n=[],r=``,i=0;for(let[a,o]of D(e))i+o>t&&r!==``&&(n.push(r),r=``,i=0),r+=a,i+=o;return r!==``&&n.push(r),n}var Ce='---\nname: lovely-mermaid\ndescription: Consult before emitting a ```mermaid block.\n---\n\n# Mermaid diagrams\n\n```mermaid fences render as Unicode box-drawing art. Supported types:\n\n- `flowchart` / `graph` — `TD`/`BT`/`LR`/`RL`, `subgraph` nesting, shapes\n  (`[rect]`, `(round)`, `{diamond}`, v2 `A@{shape: cyl, label: "…"}`),\n  `-->` / `-.->` / `==>` links, `o`/`x` end markers, `|edge labels|`.\n- `stateDiagram-v2` — transitions, `[*]`, `<<choice>>`, `id : description`,\n  composite `state X { … }` with `--` regions.\n- `classDiagram` — member compartments, `<<annotations>>`, `~generics~`,\n  all relation arrows, per-end `"cardinalities"`.\n- `erDiagram` — entities, attributes, crow\'s-foot cardinalities, quoted\n  aliases (`c["Credit Card"]`).\n- `sequenceDiagram` — messages, activations (`->>+` / `-->>-`), notes,\n  `loop`/`alt`/`opt`/`par` blocks, `autonumber`.\n- `pie` — drawn as a labelled bar list; `showData` appends raw values.\n- `mindmap` — the indentation tree, drawn with `├──` guides.\n- `timeline` — `period : event : event` rows, `section` headers.\n- `gitGraph` — `commit`/`branch`/`checkout`/`merge` with `id:`/`tag:`,\n  drawn like `git log --graph`, newest on top.\n\nWorks everywhere: YAML frontmatter `title:`, CJK and emoji in labels.\n\nFlowchart, state and class diagrams only: `:::class` tags +\n`classDef name fill:#f96,color:#000` node colors. Flowchart/class only:\n`click A "url"` / `link A "url"` become clickable OSC 8 hyperlinks.\n\nRules of thumb:\n\n- Quote label text containing `:`, `;`, `#` or brackets.\n- Other types (gantt, sankey, quadrant, …) fall back to displaying the block.\n- Terminals are narrow: prefer `TD` for long chains, keep labels short.\n',A=[{name:`flowchart`,desc:`nodes, branches, edge labels`,src:`flowchart TD
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
  C --> `}],we=x(`<meta name="description" content="Render Mermaid diagrams as Unicode box-drawing art for terminals. No browser, no SVG — a self-contained layout engine that emits text." class="svelte-1uha8ag"/>`),j=x(`<span class="dim svelte-1uha8ag"> </span>`),Te=x(`<span class="err svelte-1uha8ag">render(src) → null</span>`),Ee=x(`<a class="ghost svelte-1uha8ag" target="_blank" rel="noopener">[view]</a>`),De=x(`<span class="fit-arrow svelte-1uha8ag">▲ fits</span>`),Oe=x(`<span class="vp svelte-1uha8ag"><button> </button><!></span>`),ke=x(`<div class="art svelte-1uha8ag"><!></div>`),Ae=x(`<div class="art empty svelte-1uha8ag">⏳ waiting for a diagram…</div>`),je=x(`<div class="svelte-1uha8ag"> </div>`),Me=x(`<div class="tool-warnings svelte-1uha8ag"></div>`),Ne=x(`<button role="option"> </button>`),Pe=x(`<span class="svelte-1uha8ag"> </span>`),Fe=x(`<div class="overlay svelte-1uha8ag" role="presentation"><div class="skill-box svelte-1uha8ag" role="dialog" aria-modal="true" aria-label="The lovely-mermaid agent skill"><div class="skill-title svelte-1uha8ag"><a href="https://github.com/xl0/lovely-mermaid/blob/master/skills/lovely-mermaid/SKILL.md" class="svelte-1uha8ag">skills/lovely-mermaid/SKILL.md</a> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">[esc]</button></div> <pre class="svelte-1uha8ag"> </pre></div></div>`),Ie=x(`<main class="svelte-1uha8ag"><div class="assistant svelte-1uha8ag"><div class="header-row svelte-1uha8ag"><span class="md-h svelte-1uha8ag"># lovely-mermaid</span> <span class="spacer svelte-1uha8ag"></span> <button class="ghost svelte-1uha8ag"> </button> <button class="ghost svelte-1uha8ag">skill</button> <a href="https://github.com/xl0/lovely-mermaid" class="svelte-1uha8ag">GitHub</a> <a href="https://www.npmjs.com/package/lovely-mermaid" class="svelte-1uha8ag">npm</a></div> <p class="svelte-1uha8ag">I render Mermaid diagrams as Unicode box-drawing art, for terminals.</p></div> <div class="custom-block svelte-1uha8ag"><div class="custom-label svelte-1uha8ag">theme</div> <p class="dim note svelte-1uha8ag">Spans carry roles, never colors — the consumer maps them to an <code class="svelte-1uha8ag">AnsiTheme</code>. Styling per role regenerates the SGR codes: the exact bytes a
			terminal would get. Defaults are the library's <code class="svelte-1uha8ag">DEFAULT_THEME</code>.</p> <!> <div class="themecode svelte-1uha8ag"><pre class="svelte-1uha8ag"> </pre> <button class="tb-copy svelte-1uha8ag" title="Copy the AnsiTheme literal"> </button></div></div> <div class="tool-block svelte-1uha8ag"><div class="tool-title svelte-1uha8ag"><span class="dot svelte-1uha8ag">⏺</span> <code class="svelte-1uha8ag"> </code> <!> <!> <!> <span class="spacer svelte-1uha8ag"></span> <!> <button class="ghost svelte-1uha8ag"> </button> <span class="cols svelte-1uha8ag"><span class="dim svelte-1uha8ag">viewport</span> <!></span> <button class="ghost svelte-1uha8ag"> </button></div> <!> <!></div> <div class="editor-box svelte-1uha8ag"><span class="editor-title svelte-1uha8ag">Edit me</span> <span class="accent svelte-1uha8ag">❯</span> <textarea wrap="off" spellcheck="false" aria-label="Mermaid source" class="svelte-1uha8ag"></textarea></div> <div class="examples svelte-1uha8ag" role="listbox" aria-label="Example diagrams"></div> <div class="statusline svelte-1uha8ag"><span class="accent svelte-1uha8ag">lovely-mermaid</span> <span class="svelte-1uha8ag"> </span> <!> <span> </span> <span class="spacer svelte-1uha8ag"></span> <span class="dim svelte-1uha8ag">100% text</span></div></main> <!>`,1);function M(r,x){ne(x,!0);let C=a(m(A[0].src)),w=a(60),T=a(!0);s(()=>{document.body.classList.toggle(`light`,!t(T))});let E=a(m(structuredClone(ue.dark)));function D(e){h(T,e,!0),h(E,structuredClone(ue[e?`dark`:`light`]),!0)}let O=a(!1),k=a(!1),M=c(()=>ye.map(e=>[e,ve(t(E)[e])]).filter(([,e])=>e!==null)),Le=c(()=>Object.fromEntries(t(M))),Re=c(()=>({palette:_e,foreground:he[t(T)?`dark`:`light`].fg,background:he[t(T)?`dark`:`light`].bg})),ze=c(()=>t(M).length===0?`const theme: AnsiTheme = {};`:`const theme: AnsiTheme = {\n${t(M).map(([e,t])=>`\t${e}: '${t}',`).join(`
`)}\n};`);async function Be(){await navigator.clipboard.writeText(t(ze)),h(k,!0),setTimeout(()=>h(k,!1),1200)}let N=a(null),Ve=``;function P(e=!1){t(N)!==null&&(clearInterval(t(N)),h(N,null),e&&h(C,Ve,!0))}function He(){if(t(N)!==null){P(!0);return}Ve=t(C);let e=[...t(C)],n=0;h(C,``),h(N,setInterval(()=>{n=Math.min(n+2,e.length),h(C,e.slice(0,n).join(``),!0),n>=e.length&&P()},40),!0)}async function Ue(e){P();let n=document.documentElement.scrollHeight-window.scrollY;h(C,e.src,!0);let r=fe(e.src);r!==null&&r.width>t(w)&&h(w,[30,60,120].find(e=>r.width<=e)??1/0,!0),await l(),window.scrollTo({top:document.documentElement.scrollHeight-n})}let We=location.hash.length>1,Ge=a(!We);We&&ge(location.hash.slice(1)).then(e=>h(C,e,!0)).catch(()=>{}).finally(()=>h(Ge,!0));let F=a(``),Ke=0;s(()=>{let e=t(C);if(!t(Ge))return;let n=++Ke;if(e===``){h(F,``),history.replaceState(null,``,location.pathname);return}de(e).then(e=>{n===Ke&&(h(F,e,!0),history.replaceState(null,``,`#${e}`))})});let I=c(()=>{let e=performance.now();return{art:t(C).trim()===``?null:fe(t(C)),ms:performance.now()-e}}),L=c(()=>t(I).art),R=c(()=>t(L)!==null&&t(L).width<=t(w)),qe=c(()=>t(L)!==null&&!t(R)?[30,60,120,1/0].find(e=>e>t(w)&&t(L).width<=e)??null:null),z=c(()=>t(C).trim()===``?null:t(R)?t(L):Se(t(C),t(w)===1/0?void 0:t(w))),Je=c(()=>t(z)===null?`idle`:t(L)===null?`error`:t(R)?`ok`:`pending`),Ye=c(()=>t(L)===null||!t(R)?t(w)===1/0?`sourceBox(src)`:`sourceBox(src, ${t(w)})`:`render(src)`),Xe=c(()=>A.find(e=>e.src===t(C))?.desc??null),Ze=c(()=>t(z)===null?``:pe(t(z),t(Le)).join(`
`));async function Qe(){t(z)&&(await navigator.clipboard.writeText(t(z).plain.join(`
`)),h(O,!0),setTimeout(()=>h(O,!1),1200))}let B=a(!1),V=a(!1);s(()=>{document.documentElement.style.overflow=t(B)?`hidden`:``});async function $e(){await navigator.clipboard.writeText(Ce),h(V,!0),setTimeout(()=>h(V,!1),1200)}var et=Ie();ie(`keydown`,ce,e=>{e.key===`Escape`&&h(B,!1)}),ae(`1uha8ag`,e=>{var t=we();d(()=>{f.title=`lovely-mermaid — Mermaid diagrams as Unicode art`}),p(e,t)});var H=ee(et),U=n(H),tt=n(U),W=o(n(tt),4),nt=n(W);_(W);var rt=o(W,2);e(4),_(tt),e(2),_(U);var G=o(U,2),it=o(n(G),4);be(it,{onreset:()=>D(t(T)),get theme(){return t(E)},set theme(e){h(E,e,!0)}});var at=o(it,2),K=n(at),ot=n(K,!0);_(K);var q=o(K,2),st=n(q,!0);_(q),_(at),_(G);var J=o(G,2),Y=n(J),X=o(n(Y),2),ct=n(X,!0);_(X);var lt=o(X,2),ut=e=>{var r=j(),a=n(r);_(r),i(()=>S(a,`· ${t(Xe)??``}`)),p(e,r)};g(lt,e=>{t(Xe)&&e(ut)});var dt=o(lt,2),ft=e=>{var r=j(),a=n(r);_(r),i(()=>S(a,`art is ${t(L).width??``} cols${t(R)?``:` > ${t(w)}`}`)),p(e,r)},pt=e=>{var t=Te();p(e,t)};g(dt,e=>{t(L)?e(ft):t(z)&&e(pt,1)});var mt=o(dt,2),ht=e=>{var r=j(),a=n(r);_(r),i(e=>S(a,`${e??``} ms`),[()=>t(I).ms<.05?`<0.1`:t(I).ms.toFixed(1)]),p(e,r)};g(mt,e=>{t(z)&&e(ht)});var gt=o(mt,4),_t=e=>{var n=Ee();i(()=>y(n,`href`,`${le??``}/render/${t(F)??``}`)),p(e,n)};g(gt,e=>{t(F)!==``&&e(_t)});var Z=o(gt,2),vt=n(Z);_(Z);var yt=o(Z,2),bt=o(n(yt),2);b(bt,16,()=>[30,60,120,1/0],e=>e,(e,r)=>{var a=Oe(),s=n(a);let c;var l=n(s);_(s);var d=o(s),f=e=>{var t=De();p(e,t)};g(d,e=>{t(qe)===r&&e(f)}),_(a),i(()=>{c=v(s,1,`ghost svelte-1uha8ag`,null,c,{active:t(w)===r}),S(l,`[${(r===1/0?`∞`:r)??``}]`)}),u(`click`,s,()=>h(w,r,!0)),p(e,a)}),_(yt);var Q=o(yt,2),xt=n(Q,!0);_(Q),_(Y);var St=o(Y,2),Ct=e=>{var r=ke(),i=n(r);{let e=c(()=>t(w)===1/0?t(z).width:Math.max(t(w),t(z).width));xe(i,{get text(){return t(Ze)},get theme(){return t(Re)},get cols(){return t(e)},margin:1,cellSize:15,style:`width: auto; height: auto;`,"aria-label":`Rendered diagram`})}_(r),p(e,r)},wt=e=>{var t=Ae();p(e,t)};g(St,e=>{t(z)?e(Ct):e(wt,-1)});var Tt=o(St,2),Et=e=>{var r=Me();b(r,21,()=>t(L).warnings,se,(e,r)=>{var a=je(),o=n(a);_(a),i(()=>S(o,`⚠ ${t(r)??``}`)),p(e,a)}),_(r),p(e,r)};g(Tt,e=>{t(L)&&t(L).warnings.length&&e(Et)}),_(J);var Dt=o(J,2),$=o(n(Dt),4);oe($),_(Dt);var Ot=o(Dt,2);b(Ot,21,()=>A,e=>e.name,(e,r)=>{var a=Ne();let o;var s=n(a);_(a),i(()=>{o=v(a,1,`example svelte-1uha8ag`,null,o,{active:t(C)===t(r).src}),y(a,`aria-selected`,t(C)===t(r).src),S(s,`/${t(r).name??``}`)}),u(`click`,a,()=>Ue(t(r))),p(e,a)}),_(Ot);var kt=o(Ot,2),At=o(n(kt),2),jt=n(At,!0);_(At);var Mt=o(At,2),Nt=e=>{var r=Pe(),a=n(r);_(r),i(()=>S(a,`${t(z).width??``}×${t(z).plain.length??``} cells`)),p(e,r)};g(Mt,e=>{t(z)&&e(Nt)});var Pt=o(Mt,2);let Ft;var It=n(Pt);_(Pt),e(4),_(kt),_(H);var Lt=o(H,2),Rt=e=>{var r=Fe(),a=n(r),s=n(a),c=o(n(s),4),l=n(c,!0);_(c);var d=o(c,2);_(s);var f=o(s,2),m=n(f,!0);_(f),_(a),_(r),i(()=>{S(l,t(V)?`copied`:`[copy]`),S(m,Ce)}),u(`click`,r,e=>{e.target===e.currentTarget&&h(B,!1)}),u(`click`,c,$e),u(`click`,d,()=>h(B,!1)),p(e,r)};g(Lt,e=>{t(B)&&e(Rt)}),i((e,n,r)=>{S(nt,`[${t(T)?`light`:`dark`}]`),S(ot,t(ze)),S(st,t(k)?`[copied]`:`[copy]`),y(J,`data-state`,t(Je)),S(ct,t(Ye)),Z.disabled=e,S(vt,`[${t(N)===null?`stream`:`stop`}]`),Q.disabled=!t(z),S(xt,t(O)?`copied`:`[copy]`),y($,`rows`,n),S(jt,r),Ft=v(Pt,1,`svelte-1uha8ag`,null,Ft,{warn:t(L)!==null&&t(L).warnings.length>0}),S(It,`⚠ ${t(L)?.warnings.length??0??``}`)},[()=>t(C).trim()===``&&t(N)===null,()=>Math.max(2,t(C).split(`
`).length),()=>me(t(C))??`unknown`]),u(`click`,W,()=>D(!t(T))),u(`click`,rt,e=>{e.stopPropagation(),h(B,!0)}),u(`click`,q,Be),u(`click`,Z,He),u(`click`,Q,Qe),u(`input`,$,()=>P()),re($,()=>t(C),e=>h(C,e)),p(r,et),te()}r([`click`,`input`]);export{M as component};