A long label wraps inside the box without truncation.

```mermaid
graph TD
  A[Check if the user has permission to access resource] --> B[Done]
```

```text
 ┌───────────────────────┐
 │ Check if the user has │
 │ permission to access  │
 │       resource        │
 └───────────┬───────────┘
             │
             ▼
         ┌──────┐
         │ Done │
         └──────┘
```

A very long label truncates with an ellipsis after the line cap.

```mermaid
graph TD
  A[alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha alpha] --> B[x]
```

```text
┌──────────────────────────┐
│ alpha alpha alpha alpha  │
│ alpha alpha alpha alpha  │
│ alpha alpha alpha alpha  │
│ alpha alpha alpha alpha… │
└─────────────┬────────────┘
              │
              ▼
            ┌───┐
            │ x │
            └───┘
```

A long identifier breaks on a `_` boundary, not mid-segment.

```mermaid
graph TD
  A[mark_filter_restore_context] --> B[Done]
```

```text
┌──────────────────────┐
│ mark_filter_restore_ │
│       context        │
└───────────┬──────────┘
            │
            ▼
        ┌──────┐
        │ Done │
        └──────┘
```

Wide glyphs measure two columns; the box stays aligned.

```mermaid
graph TD
  A[日本語ab]
```

```text
┌──────────┐
│ 日本語ab │
└──────────┘
```

HTML formatting tags are stripped, `<br/>` becomes a space; generic types
like `Vec<String>` survive.

```mermaid
flowchart TD
  IDs["<b>3. Token IDs</b><br/>[ 464, 3797 ]<br/><i>indices</i>"] --> Out["Returns Vec<String>"]
```

```text
┌──────────────────────────┐
│ 3. Token IDs [ 464, 3797 │
│        ] indices         │
└─────────────┬────────────┘
              │
              ▼
   ┌─────────────────────┐
   │ Returns Vec<String> │
   └─────────────────────┘
```

HTML entities decode in the art.

```mermaid
flowchart LR
  YAML["models-config/&lt;model&gt;/&lt;env&gt;.yaml"] --> PY["model_config_map.py"]
```

```text
┌────────────────────────┐
│ models-config/<model>/ │    ┌─────────────────────┐
│       <env>.yaml       ├───▶│ model_config_map.py │
└────────────────────────┘    └─────────────────────┘
```

Markdown edge labels are stripped too.

```mermaid
flowchart TD
  A -->|"`**yes**`"| B
  A -->|"`__no__`"| C
```

```text
     ┌───┐
     │ A │
     └─┬─┘
   ┌───┴───┐
   ▼yes    ▼no
 ┌───┐   ┌───┐
 │ B │   │ C │
 └───┘   └───┘
```

Code and span tags are stripped; bare angle brackets are kept.

```mermaid
flowchart TD
  A["<code>vocab_size</code> <span style="color:red">x</span>"] --> B["a < b and c > d"]
```

```text
  ┌──────────────┐
  │ vocab_size x │
  └───────┬──────┘
          │
          ▼
 ┌─────────────────┐
 │ a < b and c > d │
 └─────────────────┘
```

Markdown strings strip bold, italic and inline code.

```mermaid
flowchart TD
  A["`**Start** here`"] --> B["`Save to **database**`"]
  B --> C["`_italic_ uses `vocab_size` with __all__`"]
```

```text
      ┌────────────┐
      │ Start here │
      └──────┬─────┘
             │
             ▼
   ┌──────────────────┐
   │ Save to database │
   └─────────┬────────┘
             │
             ▼
┌────────────────────────┐
│ italic uses vocab_size │
│        with all        │
└────────────────────────┘
```
