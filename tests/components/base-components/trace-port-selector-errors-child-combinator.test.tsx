import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("missing pin error names the component and lists its pins for child-combinator selectors", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "SDA", pin4: "SCL" }}
      />
      <trace from=".U1 > .SDAA" to="net.GND" />
    </board>,
  )

  const traceErrors = circuit
    .getCircuitJson()
    .filter((c: any) => c.type === "source_trace_not_connected_error")

  expect(traceErrors.length).toBe(1)
  expect((traceErrors[0] as any).message).toBe(
    'Could not find port for selector ".U1 > .SDAA". Component "U1" found, but does not have pin "SDAA". It has [VCC, pin1, 1, GND, pin2, 2, SDA, pin3, 3, SCL, pin4, 4, pin5, 5, pin6, 6, pin7, 7, pin8, 8]',
  )
})
