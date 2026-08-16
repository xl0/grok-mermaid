Inheritance puts the triangle at the parent.

```mermaid
classDiagram
  Animal <|-- Duck
  Animal <|-- Fish
```

```text
     ┌────────┐
     │ Animal │
     └────────┘
          △
    ┌─────┴────┐
    │          │
┌──────┐   ┌──────┐
│ Duck │   │ Fish │
└──────┘   └──────┘
```

Realization is dotted; dependency is a dotted arrow.

```mermaid
classDiagram
  IShape <|.. Circle
  Circle ..> Renderer
```

```text
 ┌────────┐
 │ IShape │
 └────────┘
      △
      ╎
 ┌────────┐
 │ Circle │
 └────┬───┘
      ╎
      ▼
┌──────────┐
│ Renderer │
└──────────┘
```

Composition and aggregation render filled and hollow diamonds.

```mermaid
classDiagram
  Car *-- Engine
  Pond o-- Duck
```

```text
  ┌─────┐    ┌──────┐
  │ Car │    │ Pond │
  └─────┘    └──────┘
     ◆           ◇
     │           │
┌────────┐   ┌──────┐
│ Engine │   │ Duck │
└────────┘   └──────┘
```

A from-end head survives a fan-out jog: one triangle for three children.

```mermaid
classDiagram
  Animal <|-- Duck
  Animal <|-- Fish
  Animal <|-- Cow
```

```text
          ┌────────┐
          │ Animal │
          └────────┘
               △
    ┌──────────┼──────────┐
    │          │          │
┌──────┐   ┌──────┐    ┌─────┐
│ Duck │   │ Fish │    │ Cow │
└──────┘   └──────┘    └─────┘
```
