import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unresolved schematic arrangement labels retain the existing render error", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        schPortArrangement={{ leftSide: ["UNKNOWN"] }}
      />
    </board>,
  )
  circuit.render()
  expect(circuit.db.schematic_component.list()).toEqual([])
  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].component_name).toBe("U1")
  expect(errors[0].message).toContain('"UNKNOWN"')
})
