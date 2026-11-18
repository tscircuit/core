# @tscircuit/core

The core logic used to build Circuit JSON from tscircuit React elements.

[tscircuit](https://github.com/tscircuit/tscircuit) &middot; [Online Playground](https://tscircuit.com/editor) &middot; [Development Guide](./docs/DEVELOPMENT.md) &middot; [Core Benchmarks](https://core-benchmarks.tscircuit.com/) &middot; [Contributor Getting Started Video](https://share.cleanshot.com/rbJpnvJZ)

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

    <trace from="R1.pin1" to="net.VCC" />
    <trace from="R1.pin2" to="L1.pos" />
    <trace from="L1.neg" to="net.GND" />
  </board>
)

circuit.getCircuitJson()
```

## System block diagrams

For high-level functional diagrams, use the [`systemblock` namespace](./docs/system-blocks.md).
Core automatically resolves block positions, sizes, routes, and label anchors into
Circuit JSON, ready for `convertCircuitJsonToSystemSvg` from `circuit-to-svg`.

## Non-React Usage

```tsx
import { Board, Resistor, Led, Trace, Circuit } from "@tscircuit/core"

const circuit = new Circuit()

const board = new Board({
  width: "10mm",
  height: "10mm",
})
circuit.add(board)

const R1 = new Resistor({ resistance: "10k", footprint: "0402" })
const L1 = new Led({ footprint: "0402" })
board.add(R1)
board.add(L1)

const trace = new Trace({ width: "0.2mm" })
trace.connect(R1.output, L1.anode)
board.add(trace)

circuit.getCircuitJson() // [{ type: "board", ...}, { type: "resistor", ...}, ...]
```

## Development

- [Declare PCB return-current experiments in TSX](./docs/pcb-return-current-simulation.md)

- [How does core work?](./docs/DEVELOPMENT.md#overview-of-how-core-works)
- [How to do benchmarking or debug performance](./docs/DEVELOPMENT.md#debugging-performance)

## Named net classes

Declare named trace-width rules in a board or subcircuit:

```tsx
<netclass name="Power" traceWidth="0.8mm" nets={["net.VCC", "net.VBAT"]} />
```

Net selectors create implicit nets when necessary. Classes stay within their containing subcircuit; duplicate names there are rejected. Lower `priority` values win (default zero), then class name. A class without `traceWidth` defers to the next class. A class named `Default` applies as the final fallback to every net in its subcircuit. An explicit net `nominalTraceWidth` takes precedence; the board default applies when no class provides a width.

Circuit JSON retains each class as `source_net_class` and ordered membership in `source_net.source_net_class_ids`, independently of each net's resolved width. This API covers nominal widths and class identity; it does not implement the separate clearance-matrix proposal.
