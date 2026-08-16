A class renders title, attribute and method compartments.

```mermaid
classDiagram
  class Animal {
    +int age
    +isMammal() bool
  }
  Animal <|-- Duck
```

```text
┌──────────────────┐
│      Animal      │
├──────────────────┤
│ +int age         │
├──────────────────┤
│ +isMammal() bool │
└──────────────────┘
          △
          │
      ┌──────┐
      │ Duck │
      └──────┘
```

Colon members merge with a class block.

```mermaid
classDiagram
  class Duck {
    +swim()
  }
  Duck : +String beakColor
  S --> Duck
```

```text
         ┌───┐
         │ S │
         └─┬─┘
           │
           ▼
 ┌───────────────────┐
 │       Duck        │
 ├───────────────────┤
 │ +String beakColor │
 ├───────────────────┤
 │ +swim()           │
 └───────────────────┘
```

An empty class is a plain titled box.

```mermaid
classDiagram
  class Loner
  A --> Loner
```

```text
   ┌───┐
   │ A │
   └─┬─┘
     │
     ▼
 ┌───────┐
 │ Loner │
 └───────┘
```

An annotation renders guillemets; generics display as angle brackets.

```mermaid
classDiagram
  <<interface>> Shape
  Shape~T~ : +area() T
  Shape~T~ <|.. Circle
```

```text
 ┌─────────────┐   ┌───────────┐
 │ «interface» │   │ Shape<T>  │
 │    Shape    │   ├───────────┤
 └─────────────┘   │ +area() T │
                   └───────────┘
                         △
                         ╎
                    ┌────────┐
                    │ Circle │
                    └────────┘
```
