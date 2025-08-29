import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pin with requiresPower emits warning when unconnected", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        pinAttributes={{ VCC: { requiresPower: true } }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_pin_missing_trace_warning")

  expect(warnings).toHaveLength(1)
})
