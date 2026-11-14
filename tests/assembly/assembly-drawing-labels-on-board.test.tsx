import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a labeled board part view resolves membership and dimensions in the same drawing frame", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="DEVICE">
      <board name="BOARD" width={40} height={24} routingDisabled>
        <hole name="H1" diameter={3} pcbX={-12} pcbY={5} />
        <hole name="H2" diameter={3} pcbX={10} pcbY={-4} />
      </board>
      <assembly.drawing.page
        width={180}
        height={140}
        anchorAlignment="top_left"
      >
        <assembly.drawing.partview
          name="board"
          partRef=".BOARD"
          displayName="LABELED PCB - TOP LEFT PAGE ANCHOR"
          direction="z+"
          width={85}
          height={65}
          centerX={90}
          centerY={-65}
        >
          <assembly.drawing.partlabel
            text="Board substrate"
            boardRefs={[".BOARD"]}
            anchor={{ x: 20, y: 12, z: 0 }}
            xOffsetFromViewCenter={50}
            paperY={-27}
          />
          <assembly.drawing.dimension fromRef=".H1" toRef=".H2" axis="x" />
          <assembly.drawing.note
            text="22 mm hole spacing"
            xOffsetFromViewCenter={-30}
            paperY={-110}
          />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const view = circuit.db.drawing_part_view.list()[0]
  expect(view.source_group_id).toBeUndefined()
  expect(view.drawing_assembly_stage_id).toBeDefined()
  expect(circuit.db.drawing_assembly_stage.list()[0].pcb_board_ids).toEqual([
    circuit.db.pcb_board.list()[0].pcb_board_id,
  ])
  const dimension = circuit.db.drawing_dimension_line.list()[0]
  expect(dimension.text).toBe("22 mm")
  expect(dimension.drawing_part_view_id).toBe(view.drawing_part_view_id)
  expect(circuit.db.drawing_part_label.list()[0].drawing_part_view_id).toBe(
    view.drawing_part_view_id,
  )
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
