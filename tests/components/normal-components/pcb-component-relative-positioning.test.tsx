import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression test ensuring pcb components record their relative positioning context
// when placed under groups or directly on the board.
test("pcb components include relative positioning metadata", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="10mm">
      <group pcbX={0} pcbY={0} name="G1">
        <resistor
          resistance="1k"
          pcbX={-2}
          pcbY={-3}
          footprint="0402"
          name="R1"
        />
      </group>
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        pcbX={5}
        pcbY={2}
        name="C1"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbGroup = circuit.db.pcb_group.getWhere({ name: "G1" })
  const pcbBoard = circuit.db.pcb_board.list()[0]

  expect(pcbGroup).toBeTruthy()
  expect(pcbBoard).toBeTruthy()

  const sourceR1 = circuit.db.source_component.getWhere({ name: "R1" })!
  const sourceC1 = circuit.db.source_component.getWhere({ name: "C1" })!

  const pcbR1 = circuit.db.pcb_component.getWhere({
    source_component_id: sourceR1.source_component_id,
  })!
  const pcbC1 = circuit.db.pcb_component.getWhere({
    source_component_id: sourceC1.source_component_id,
  })!

  const pcbR1Positioning = pcbR1 as any
  const pcbC1Positioning = pcbC1 as any

  expect(pcbR1Positioning.position_mode).toBe("relative")
  expect(pcbR1Positioning.positioned_relative_to_pcb_group_id).toBe(
    pcbGroup?.pcb_group_id,
  )
  expect(pcbR1Positioning.positioned_relative_to_pcb_board_id).toBeUndefined()

  expect(pcbC1Positioning.position_mode).toBe("relative")
  expect(pcbC1Positioning.positioned_relative_to_pcb_group_id).toBeUndefined()
  expect(pcbC1Positioning.positioned_relative_to_pcb_board_id).toBe(
    pcbBoard.pcb_board_id,
  )

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
  })
})
