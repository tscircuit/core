# @tscircuit/core

> [!WARNING]
> You should use [@tscircuit/builder](https://github.com/tscircuit/builder) instead, this package is
> going to be in alpha for a while.

A rewrite of [tscircuit builder](https://github.com/tscircuit/builder) with a ThreeJS-like API and architecture.

## Usage

```ts
import { Board, Resistor, Led, Trace, Project } from "@tscircuit/core"

const project = new Project()

const board = new Board({
  width: "10mm",
  height: "10mm",
})
project.add(board)

const R1 = new Resistor({ resistance: "10k", footprint: "0402" })
const LED1 = new Led({ footprint: "0402" })

board.add(R1)
board.add(LED1)

const trace = new Trace({ width: "0.2mm" })
trace.connect(R1.output, LED1.anode)
board.add(trace)

project.getJson() // [{ type: "board", ...}, { type: "resistor", ...}, ...]
```

## Internals

### Phases in Rendering

- After Creation
- Premount
- Postmount
- \[pre|post\]schematic render
- \[pre|post\]pcb component render
- \[pre|post\]pcb trace render

### Element Lifecycle

There are different lifecycle methods for each instance to help it tap into these
rendering phases. At each phase it can modify the soup (circuit json)
to modify the circuit, adding or changing elements that are relevant.

- `constructor(...)`
- `onPreMount(ctx)`
- `onPostMount(ctx)`
- `onPreSchematicRender(ctx)`
- `onSchematicRender(ctx)`
- `onPostSchematicRender(ctx)`
- `onPrePcbComponentRender(ctx)`
- `onPcbComponentRender(ctx)`
- `onPostPcbComponentRender(ctx)`
- `onPrePcbTraceRender(ctx)`
- `onPcbTraceRender(ctx)`
- `onPostPcbTraceRender(ctx)`

### Element Context

The context object is passed to each lifecycle method and contains the following
properties:

- `soup`: The circuit json
- `board`: The board instance
- `parent`: The board element
