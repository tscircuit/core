import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board part references select source groups without altering PCB placement", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board name="CONTROL" width={30} height={20} routingDisabled>
        {[-11, 11].flatMap((x) =>
          [-6, 6].map((y) => <hole diameter={2.5} pcbX={x} pcbY={y} />),
        )}
        {[-5.08, -2.54, 0, 2.54, 5.08].flatMap((x) =>
          [-6, 6].map((y) => (
            <platedhole
              name={`J${y > 0 ? 1 : 2}_${x}`}
              holeDiameter={1}
              outerDiameter={1.8}
              shape="circle"
              pcbX={x}
              pcbY={y}
            />
          )),
        )}
      </board>
      <assembly.drawing.page size="iso_a4">
        <assembly.drawing.titleblock
          title="LAMP DRIVER CARRIER - DRILL PATTERN"
          identificationNumber="LMP-002-PCB"
          revisionIndex="A"
          creator="tscircuit"
          legalOwner="tscircuit"
          approvalPerson="PRELIMINARY"
          dateOfIssue="2026-10-21"
          sheetNumber={1}
          numberOfSheets={1}
        />
        <assembly.drawing.partview
          partRef=".CONTROL"
          name="plan"
          displayName="COMPONENT SIDE"
          direction="z+"
          width={90}
          height={65}
          centerX={-45}
          centerY={25}
        />
        <assembly.drawing.partview
          partRef=".CONTROL"
          name="bottom"
          displayName="SOLDER SIDE"
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
