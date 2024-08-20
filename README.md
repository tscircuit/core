# @tscircuit/core

> [!WARNING]
> You should use [@tscircuit/builder](https://github.com/tscircuit/builder) instead, this package is
> going to be in alpha for a while.

A rewrite of [tscircuit builder](https://github.com/tscircuit/builder) with a ThreeJS/react-three-like API and architecture.

## Usage

```tsx
import { Board, Resistor, Led, Trace, Project } from "@tscircuit/core"

const project = new Project()

const board = new Board({
  width: "10mm",
  height: "10mm",
})
project.add(board)

const R1 = new Resistor({ resistance: "10k", footprint: "0402" })
board.add(R1)

// You can also add elements with React
board.add(<led footprint="0402" />)

const trace = new Trace({ width: "0.2mm" })
trace.connect(R1.output, LED1.anode)
board.add(trace)

project.getJson() // [{ type: "board", ...}, { type: "resistor", ...}, ...]
```
