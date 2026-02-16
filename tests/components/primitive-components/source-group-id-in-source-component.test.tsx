import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group id present in pcb_component, schematic_component and source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group name="G1">
        <resistor name="R1" footprint={"0402"} resistance={100} />
        <resistor name="R2" footprint={"0402"} resistance={100} />
      </group>
      <capacitor name="C1" footprint={"0402"} capacitance={100} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schComponents = circuit.db.schematic_component.list()
  for (const schComponent of schComponents) {
    expect(schComponent.schematic_group_id).toBeDefined()
  }

  const schGroups = circuit.db.schematic_group.list()
  for (const schGroup of schGroups) {
    expect(schGroup.schematic_group_id).toBeDefined()
  }

  const sourceComponents = circuit.db.source_component.list()
  for (const sourceComponent of sourceComponents) {
    expect(sourceComponent.source_group_id).toBeDefined()
  }

  const sourceGroups = circuit.db.source_group.list()
  for (const sourceGroup of sourceGroups) {
    expect(sourceGroup.source_group_id).toBeDefined()
  }

  const pcbComponents = circuit.db.pcb_component.list()
  pcbComponents.some((d) => d.pcb_group_id === undefined)

  const pcbGroups = circuit.db.pcb_group.list()
  for (const pcbGroup of pcbGroups) {
    console.log(pcbGroup)
    expect(pcbGroup.pcb_group_id).toBeDefined()
  }
})
