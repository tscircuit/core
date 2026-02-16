import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group id present in pcb_component, schematic_component and source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group name="G1">
      <resistor name="R1" pcbX={-2} footprint={"0402"} resistance={100} />
      <resistor name="R2" pcbX={2} footprint={"0402"} resistance={100} />
    </group>,
  )

  await circuit.renderUntilSettled()

  const pcbGroups = circuit.db.pcb_group.list()
  expect(pcbGroups).toHaveLength(1)
  const pcbGroup = pcbGroups[0]

  expect(pcbGroup.name).toBe("G1")
  expect(pcbGroup.type).toBe("pcb_group")
  expect(pcbGroup.is_subcircuit).toBe(true)
  expect(pcbGroup.pcb_group_id).toBe("pcb_group_0")
  expect(pcbGroup.source_group_id).toBe("source_group_0")
  expect(pcbGroup.subcircuit_id).toBe("subcircuit_source_group_0")
  expect(pcbGroup.center).toEqual({ x: 0, y: 0 })
  expect(pcbGroup.width).toBeGreaterThan(0)
  expect(pcbGroup.height).toBeGreaterThan(0)
  expect(Array.isArray(pcbGroup.pcb_component_ids)).toBe(true)
})
