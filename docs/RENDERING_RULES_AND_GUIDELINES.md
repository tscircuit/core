# Rendering Rules and Guidelines

## 1. Don't mutate `db` outside of render phases

The `db` is the mutable Circuit Json array. It is often changed and refreshed, and because of that it is
very easy to create bugs when you change it. To prevent this, we're very careful with code that mutates
the `db`

If your method mutates the database in some way, make sure it's named appropriately. A function like
`compute*` or `get*` should never mutate the `db` because the prefix `compute*` and `get*` implies they
are immutable.


## 2. Understand beforeLayout transforms

Before a circuit is laid out, positions of components are calculated using `computeSchematicGlobalTransform` (or
`computePcbGlobalTransform` for PCBs), these methods are very simple. They basically say "the current position is `parentTransform ⊕ propsTransform`"

The `parentTransform` is any translation or rotations that are due to parents. For example, a `<resistor />` in a
`<group />` will be translated by whatever the `<group />`'s `pcbX/pcbY` or `schX/schY` are.

The `propsTransform` is the transform from the props, examining your own `pcbX/pcbY`

These methods are called recursively, that way you can have a `<group />` in another `<group />`. The `parentTransform`
contains the sum of all ancestor transforms!

For both PCBs and Schematics, the schematic or PCB is laid out using the `beforeLayout` positions, then a render phase phase
like `SchematicLayout` is run to move components according to the layout position.
