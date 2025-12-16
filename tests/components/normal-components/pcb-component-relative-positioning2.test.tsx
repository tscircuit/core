import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb components include relative positioning metadata 2", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="10mm" pcbPack>
      <group pcbX={0} pcbY={0} name="G1">
        <resistor resistance="1k" footprint="0402" name="R1" />
      </group>
      <capacitor capacitance="1000pF" footprint="0402" name="C1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
  })

  const sourceR1 = circuit.db.source_component.getWhere({ name: "R1" })!
  const sourceC1 = circuit.db.source_component.getWhere({ name: "C1" })!

  const pcbR1 = circuit.db.pcb_component.getWhere({
    source_component_id: sourceR1.source_component_id,
  })!
  const pcbC1 = circuit.db.pcb_component.getWhere({
    source_component_id: sourceC1.source_component_id,
  })!

  expect(pcbR1.position_mode).toBe("packed")
  expect(pcbR1.positioned_relative_to_pcb_group_id).toBeUndefined()
  expect(pcbR1.positioned_relative_to_pcb_board_id).toBeUndefined()

  expect(pcbC1.position_mode).toBe("packed")
  expect(pcbC1.positioned_relative_to_pcb_group_id).toBeUndefined()
  expect(pcbC1.positioned_relative_to_pcb_board_id).toBeUndefined()
})
