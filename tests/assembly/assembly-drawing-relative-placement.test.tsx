import { expect, test } from "bun:test"
import { assembly } from "lib"
import { lampBase } from "./fixtures/reference-surface-lamp"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("all four relative references resolve forward declarations and unequal viewport sizes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part name="housing" cadModel={{ jscad: lampBase }} />
      <assembly.drawing.page size="iso_a3">
        <assembly.drawing.titleblock
          title="DESK LAMP - BASE"
          identificationNumber="LMP-001-BASE"
          revisionIndex="A"
          creator="tscircuit"
          legalOwner="tscircuit"
          approvalPerson="PRELIMINARY"
          dateOfIssue="2026-10-21"
          sheetNumber={1}
          numberOfSheets={1}
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="left"
          displayName="LEFT ELEVATION"
          direction="x-"
          width={60}
          height={30}
          leftOfRef=".plan"
          centerY={30}
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="right"
          displayName="RIGHT ELEVATION"
          direction="x+"
          width={60}
          height={35}
          rightOfRef=".plan"
          centerY={30}
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="above"
          displayName="TOP VIEW"
          direction="z+"
          width={60}
          height={70}
          aboveRef=".plan"
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="below"
          displayName="UNDERSIDE"
          direction="z-"
          width={60}
          height={70}
          belowRef=".plan"
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="plan"
          displayName="FRONT ELEVATION"
          direction="y-"
          width={60}
          height={30}
          centerY={30}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const centers = Object.fromEntries(
    circuit.db.drawing_part_view.list().map((view) => [view.name, view.center]),
  )
  expect(centers).toEqual({
    left: { x: -60, y: 30 },
    right: { x: 60, y: 30 },
    above: { x: 0, y: 80 },
    below: { x: 0, y: -20 },
    plan: { x: 0, y: 30 },
  })
  const relative = circuit.selectOne(".left")!
  expect(relative._parsedProps.centerX).toBeUndefined()
  expect(relative.props.leftOfRef).toBe(".plan")
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
