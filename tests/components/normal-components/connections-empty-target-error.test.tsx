import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty connections target is reported as an invalid prop instead of crashing the render", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={8}
        connections={{ pin1: "", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const connectionsErrors = circuit.db.source_invalid_component_property_error
    .list()
    .filter((error) => error.property_name === "connections")

  expect(connectionsErrors).toHaveLength(1)
  expect(connectionsErrors[0].message).toMatchInlineSnapshot(
    `"Invalid connections prop on capacitor "C1": the target for pin "pin1" is empty. Set it to a selector such as ".R1 > .pin1" or "net.GND". Remove the pin from connections if it is unconnected."`,
  )
  expect(connectionsErrors[0].message).toContain('capacitor "C1"')
  expect(connectionsErrors[0].message).toContain("pin1")

  // The render still completes rather than throwing: both components exist.
  const sourceComponentNames = circuit.db.source_component
    .list()
    .map((c) => c.name)
    .sort()
  expect(sourceComponentNames).toEqual(["C1", "R1"])

  // The sibling, valid connection still produced its source_trace.
  expect(circuit.db.source_trace.list()).toHaveLength(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
