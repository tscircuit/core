import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("whitespace-only and empty array-entry connection targets are reported without crashing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={8}
        connections={{
          pin1: "   ",
          pin2: [".R1 > .pin1", ""],
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const connectionsErrors = circuit.db.source_invalid_component_property_error
    .list()
    .filter((error) => error.property_name === "connections")
    .map((error) => error.message)

  // The whitespace-only pin1 and the empty entry inside pin2's array are both
  // reported, and both name their pin.
  expect(connectionsErrors).toHaveLength(2)
  expect(connectionsErrors.some((m) => m.includes('pin "pin1"'))).toBe(true)
  expect(connectionsErrors.some((m) => m.includes('pin "pin2"'))).toBe(true)

  // The valid ".R1 > .pin1" entry in pin2's array still produced its trace.
  expect(circuit.db.source_trace.list()).toHaveLength(1)
})
