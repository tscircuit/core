import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPositionMode relative_to_board_anchor is reflected in pcb_component metadata", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="22mm" height="20mm">
      <chip
        name="U1"
        footprint="dip8"
        pcbX={0}
        pcbY={4}
        pcbPositionMode="relative_to_board_anchor"
      />
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.db.pcb_board.list()[0]
  const sourceU1 = circuit.db.source_component.getWhere({ name: "U1" })!
  const pcbU1 = circuit.db.pcb_component.getWhere({
    source_component_id: sourceU1.source_component_id,
  })!

  expect((pcbU1 as any).position_mode).toBe("relative_to_board_anchor")
  expect(pcbU1.positioned_relative_to_pcb_board_id).toBe(board.pcb_board_id)
  expect(pcbU1.positioned_relative_to_pcb_group_id).toBeUndefined()
  expect(Number(pcbU1.display_offset_x)).toBe(0)
  expect(Number(pcbU1.display_offset_y)).toBe(4)
})
