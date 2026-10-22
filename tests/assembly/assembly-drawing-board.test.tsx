import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board part references select source groups without altering PCB placement", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board name="CONTROL" width={30} height={20} routingDisabled>
        <hole diameter={3} pcbX={-10} pcbY={-5} />
        <hole diameter={3} pcbX={10} pcbY={5} />
      </board>
      <assembly.drawing.page width={210} height={150}>
        <assembly.drawing.titleblock title="Control board — source group selection" />
        <assembly.drawing.partview
          partRef=".CONTROL"
          name="plan"
          direction="z+"
          width={90}
          height={65}
          centerX={-45}
          centerY={25}
        />
        <assembly.drawing.partview
          partRef=".CONTROL"
          name="bottom"
          direction="z-"
          width={90}
          height={65}
          rightOfRef=".plan"
          centerY={25}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const group = circuit.db.source_group
    .list()
    .find((group) => group.name === "CONTROL")!
  expect(
    circuit.db.drawing_part_view.list().map((view) => view.source_group_id),
  ).toEqual([group.source_group_id!, group.source_group_id!])
  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    center: { x: 0, y: 0 },
    width: 30,
    height: 20,
  })
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
