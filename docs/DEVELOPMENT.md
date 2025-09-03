# @tscircuit/core Development Guide

## Overview of how core works

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

## Debugging Performance

You can use `bun run start:benchmarking` to debug the performance of core. The video below
takes you through each step from creating benchmarking circuits, to using chrome dev tools
to see the time spent per function call, to making changes and seeing the result

Most performance issues are due to "some dumb thing", not fundamentally time-consuming
algorithms.

https://github.com/user-attachments/assets/73ae3227-891c-4a01-9f02-3b04f5aa2ac5

## Getting Inputs for Algorithms

Complex algorithms like the autorouter, pcb packing, schematic trace solving
etc. have JSON inputs that can be copied into their respective debuggers, which
are hosted on web pages. To get debug inputs for these algorithms:

1. Find the relevant function call to the algorithm, e.g. you might find that
   `Group_doInitialSchematicTraceRender.ts` is calling the [schematic-trace-solver](https://github.com/tscircuit/schematic-trace-solver)
2. Set `export DEBUG=Group_doInitialSchematicTraceRender` in your terminal, this
   will enable logging of debug files and messages. The `DEBUG` environment
   variable should be set to whatever `debugOutput` you're trying to enable.
3. Run a test that reproduces the issue you're trying to debug, e.g. `bun run test/repros/repro50-rp2040-decoupling-capacitors.test.ts`
4. In the terminal, you'll see that the relevant inputs to the algorithms are
   written to the `debug-output` directory.
5. Copy that input JSON and paste it into the relevant debugger, e.g. [schematic-trace-solver paste input web debugger](https://schematic-trace-solver.vercel.app/?fixture=%7B%22path%22%3A%22site%2FPasteInput.page.tsx%22%7D)
