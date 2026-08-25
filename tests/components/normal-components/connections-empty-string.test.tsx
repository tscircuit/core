import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Empty string in connections records source_component_misconfigured_error and renders valid sibling connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        connections={{ pin1: "", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const misconfiguredErrors = circuitJson.filter(
    (item: any) => item.type === "source_component_misconfigured_error",
  )

  expect(misconfiguredErrors).toHaveLength(1)
  expect(misconfiguredErrors[0].message).toContain(
    'has an empty connections target for pin "pin1"',
  )

  const traces = circuitJson.filter((item: any) => item.type === "source_trace")
  expect(traces.length).toBeGreaterThan(0)
})
