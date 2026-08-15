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
