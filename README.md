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

## Routing progress and cancellation

`renderUntilSettled()` waits for asynchronous routing and emits routing progress
on the circuit, including routing inside isolated subcircuits:

```tsx
const controller = new AbortController()
circuit.on("autorouting:progress", (event) => {
  console.log(event.phase, event.progress)
})

const rendering = circuit.renderUntilSettled({ signal: controller.signal })
// For example, a Cancel button can call:
// controller.abort(new Error("Canceled by user"))
await rendering
```

For isolated routing, `isolatedSubcircuitPath` identifies the render context from
outermost to innermost subcircuit. Combine it with `subcircuit_id` when tracking
concurrent phases; the IDs inside each isolated circuit remain local to its JSON.

Aborting rejects the render with `signal.reason`, stops the active local router,
and prevents later routing phases from starting. Remote requests and polling are
aborted locally; cancellation does not delete an already submitted server job.
Local cancellation is cooperative: a synchronous solver step must return before
the event loop can process cancellation.

For a manual loop using `circuit.render()`, call
`circuit.cancelRendering(reason)` to stop routing. Cancellation is terminal for
that circuit; create a new `Circuit` to restart. The optional signal is detached
after a completed render, so aborting it later does not cancel that circuit.

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
