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

## Supplier availability checks

Stock checks are disabled by default. Opt in with `platform.checkAvailability`
and await the asynchronous render:

```tsx
const circuit = new Circuit({ platform: { checkAvailability: true } })
circuit.add(
  <board routingDisabled>
    <resistor
      name="R1"
      resistance="10k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C25804"] }}
    />
  </board>
)
await circuit.renderUntilSettled()
```

Core queries `jlcsearch.tscircuit.com` after parts-engine selection. If none of a
component's JLCPCB alternatives can be confirmed in stock, it emits a
`source_component_availability_warning` saying the component “may not have
availability.” Missing stock data, failed requests, and timeouts also produce
this advisory warning. Parts marked `doNotPlace`, BOM-disabled parts, and disabled
DRC checks are skipped. Platforms can supply `platformFetch` for these requests.

Enabling this setting adds network requests and non-deterministic diagnostics.
The service may cache stock data, so warnings do not guarantee current JLCPCB
availability. Omit the setting or use `false` for deterministic rendering.

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

- [How does core work?](./docs/DEVELOPMENT.md#overview-of-how-core-works)
- [How to do benchmarking or debug performance](./docs/DEVELOPMENT.md#debugging-performance)
