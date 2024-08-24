# @tscircuit/core Development Guide

When you do...

```tsx
createInstanceFromElement(
  <resistor name="R1" resistance="10k" footprint="0402" />
)
```

...you're creating a new [Resistor](../lib/components/normal-components/Resistor.ts)
class instance.

Everything you create in React becomes a class instance.

A project contains react elements and class instances that are added to it:

```tsx
const project = new Project()

project.add(
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="10k" footprint="0402" />
  </board>
)
```

when you call `project.render()`, the project will go through a series of
rendering phases. You can see all the render phases in the [Renderable class](../lib/components/base-components/Renderable.ts)

The render phases are executed in the order in that file. Each render phase
has a specific purpose.

For each render phase, every single class instance in the project gets a call
to the `doInitial*` method for each render phase (if it's defined for the class)

For example, one of the first render phases is `SourceRender`. This is where
`source_*` [circuit json/soup elements](https://github.com/tscircuit/soup) are
added to the projects output.

The output is stored inside `project.db`, it's basically an array of circuit
json elements, but it has a bunch of utility methods added to it that make it
easier to work with. Here's an example of inserting a new source_component:

```tsx
class Resistor extends NormalComponent<typeof resistorProps> {
  doInitialSourceRender() {
    this.project.db.source_component.insert({
      ftype: "simple_resistor",
      name: "R1",
      manufacturer_part_number: "1234",
      supplier_part_numbers: ["12345"],
    })
  }
}
```

There are other things that happen for render phases, for example, when a
component is removed the `remove*` method is called in order for each render
phase e.g. `removeSourceRender`

After all the render phases are complete, you can get the full circuit json/soup
by calling `project.getCircuitJson()` or `project.getSoup()`
