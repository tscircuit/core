import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A trace pointing at a pin label containing "+" (e.g. a stepper driver's PUL+)
// used to fail with a misleading error: the parent selector was sliced with a
// dangling combinator (".U2 > ") so the message blamed an empty/unrelated
// component. It should instead name the real component and list its pins.
//
// Note: pinLabels containing "+"/"-" are excluded upstream by the
// @tscircuit/props schema (see filterPinLabels + the source_property_ignored
// warning), so the trace still cannot connect here — but the diagnostic must at
// least be accurate.
test("trace to a '+' pin reports an accurate not-connected error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U2"
        footprint="soic4"
        pinLabels={{ pin1: "VINp", pin2: "GND" }}
      />
      <net name="GND" />
      <trace from=".U2 > .VIN+" to="net.GND" />
    </board>,
  )

  circuit.render()

  const error = circuit
    .getCircuitJson()
    .find((el) => el.type === "source_trace_not_connected_error") as
    | { message: string }
    | undefined

  expect(error).toBeDefined()
  // Names the actual component, not a dangling ".U2 > " or an unrelated one.
  expect(error!.message).toContain('Component "U2" found')
  expect(error!.message).not.toContain('Component ".U2')
  // Lists the component's real pins rather than "It has no ports".
  expect(error!.message).toContain("VINp")
})
