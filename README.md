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

## Fabricator stackups

A `fabricatorPreset` infers a `pcb_stackup` only when the board's layer count,
nominal thickness and material identify exactly one construction in the sourced
JLCPCB catalogue. Unsupported or ambiguous combinations emit no inferred stackup.
For example, a 4-layer, 1.0 mm FR-4 board matches several prepreg constructions;
choosing the first would give downstream calculations unconfirmed dielectric data.

An explicit `pcb_stackup` in imported `circuitJson` takes precedence, including
when the board dimensions alone are ambiguous. Supply the chosen construction's
layer data there when it is known; see the
[imported stackup example](./tests/components/normal-components/board-stackup-imported5.test.tsx).

## Development

- [Declare PCB return-current experiments in TSX](./docs/pcb-return-current-simulation.md)

- [How does core work?](./docs/DEVELOPMENT.md#overview-of-how-core-works)
- [How to do benchmarking or debug performance](./docs/DEVELOPMENT.md#debugging-performance)
