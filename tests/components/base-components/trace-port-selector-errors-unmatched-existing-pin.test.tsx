import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pin-not-found error suggests working selectors when the pin exists", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "SDA", pin4: "SCL" }}
      />
      <trace from="U1 > .SDA" to="net.GND" />
    </board>,
  )

  const traceErrors = circuit
    .getCircuitJson()
    .filter((c: any) => c.type === "source_trace_not_connected_error")

  expect(traceErrors.length).toBe(1)
  expect((traceErrors[0] as any).message).toBe(
    'Could not find port for selector "U1 > .SDA". Component "U1" has pin "SDA", but the selector did not match it. Use "U1.SDA" or ".U1 > .SDA"',
  )
})
