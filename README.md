# @tscircuit/core

The core logic used to build Circuit JSON from tscircuit React elements.

[tscircuit](https://github.com/tscircuit/tscircuit) &middot; [Development Guide](./docs/DEVELOPMENT.md) &middot; [Core Benchmarks](https://core-benchmarks.tscircuit.com/) &middot; [AI Generated Wiki](https://deepwiki.com/tscircuit/core)

You can use `core` to create [Circuit JSON](https://github.com/tscircuit/circuit-json), which can then
be converted into Gerbers, viewed online, and much more.

## Usage

```tsx
import { Circuit } from "@tscircuit/core"

const circuit = new Circuit()

circuit.add(
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="10k" footprint="0402" />
    <led name="L1" footprint="0402" />

    <trace from=".R1 > .pin1" to="net.VCC" />
    <trace from=".R1 > .pin2" to=".L1 > .pos" />
    <trace from=".L1 > .neg" to="net.GND" />
  </board>
)

circuit.getCircuitJson()
```

## Non-React Usage

```tsx
import { Board, Resistor, Led, Trace, Circuit } from "@tscircuit/core"

const circuit = new Circuit()

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

circuit.getJson() // [{ type: "board", ...}, { type: "resistor", ...}, ...]
```
