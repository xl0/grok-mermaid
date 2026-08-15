A back edge between adjacent ranks returns locally beside the forward
edge; one skipping ranks goes around through the side lane.

```mermaid
graph TD
  A --> B
  B --> C
  B --> A
  C --> A
```

```text
 ┌───┐
 │ A │◄┐
 └─┬─┘ │
   │▲  │
   ▼│  │
 ┌──┴┐ │
 │ B │ │
 └─┬─┘ │
   │   │
   ▼   │
 ┌───┐ │
 │ C ├─┘
 └───┘
```

Adjacent-rank back edges return locally at every step of a chain.

```mermaid
graph TD
  A --> B
  B --> C
  B --> A
  C --> B
```

```text
 ┌───┐
 │ A │
 └─┬─┘
   │▲
   ▼│
 ┌──┴┐
 │ B │
 └─┬─┘
   │▲
   ▼│
 ┌──┴┐
 │ C │
 └───┘
```

All three regimes in one realistic pipeline: a local `flaky` return, two
multi-rank lanes (`roll`/`notify` back to earlier ranks) and a `no` skip
edge — no crossings between the local return and its forward sibling.

```mermaid
flowchart TD
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
  notify --> push
```

```text
                ┌──────────┐
                │ Git push │◄────────────┐
                └─────┬────┘             │
                      │                  │
                      ▼                  │
                ╔═══════════╗            │
                ║ CI green? ║            │
                ╚═════╤═════╝            │
                  ┌───┴───────────┐      │
                  ▼yes            │      │
           ┌─────────────┐        │      │
           │ Build image │        │      │
           └──────┬──────┘        │      │
                  │               │      │
                  ▼               │      │
         ┌────────────────┐       │      │
         │ Deploy staging │◄──────┼─────┐│
         └────────┬───────┘       │     ││
                  │ ▲flaky        │     ││
                  ▼ │             │     ││
           ╔════════╧════╗        │     ││
           ║ Smoke tests ║        │     ││
           ╚══════╤══════╝        │     ││
        ┌─────────┴────────┐      │     ││
        ▼pass              ▼fail  ▼no   ││
 ┌─────────────┐   ┌───────────────┐    ││
 │ Deploy prod │   │ Notify author ├────┼┘
 └──────┬──────┘   └───────────────┘    │
        │                               │
        ▼                               │
┌──────────────┐                        │
│ Monitor SLOs │                        │
└───────┬──────┘                        │
        │                               │
        ▼regression                     │
  ┌──────────┐                          │
  │ Rollback ├──────────────────────────┘
  └──────────┘
```
