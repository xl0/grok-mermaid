# Pie charts

Proportions as a labelled bar list — a terminal has no circles worth drawing.

```mermaid
pie title Pets
  "Dogs" : 386
  "Cats" : 85
  "Rats" : 15
```

```text
             Pets
Dogs  ███████████████▉      79%
Cats  ███▌                  17%
Rats  ▋                      3%
```

`showData` appends the raw values.

```mermaid
pie showData
  "A" : 3
  "B" : 1
```

```text
A  ███████████████       75%  (3)
B  █████                 25%  (1)
```

Eighth-block rounding carries into a full cell: 999 of 1000 is a full bar,
not a dropped fraction.

```mermaid
pie
  "a" : 999
  "b" : 1
```

```text
a  ████████████████████ 100%
b  ▏                      0%
```
