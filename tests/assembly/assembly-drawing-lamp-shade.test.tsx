import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LampShade } from "./fixtures/reference-surface-lamp"

test("lamp shade drawing sections the tapered shell, mounting collar and support ribs", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart name="SHADE" material="pla" jscad={<LampShade />} />
      <assembly.drawing.page size="iso_a4" name="lamp-shade">
        <assembly.drawing.titleblock
          title="DESK LAMP - SHADE"
          identificationNumber="LMP-001-SHADE"
          revisionIndex="A"
          creator="tscircuit"
          legalOwner="tscircuit"
          approvalPerson="PRELIMINARY"
          dateOfIssue="2026-10-21"
          sheetNumber={1}
          numberOfSheets={1}
        />
        <assembly.drawing.partview
          partRef=".SHADE"
          name="top"
          displayName="TOP VIEW"
          direction="z+"
          width={85}
          height={85}
          centerX={-90}
          centerY={50}
        />
        <assembly.drawing.partview
          partRef=".SHADE"
          name="front"
          displayName="FRONT ELEVATION"
          direction="y-"
          width={85}
          height={60}
          centerX={-90}
          belowRef=".top"
        />
        <assembly.drawing.partview
          partRef=".SHADE"
          name="section"
          displayName="CENTRAL SECTION X=0"
          direction="x+"
          width={85}
          height={60}
          rightOfRef=".front"
          centerY={-22.5}
          section={{
            axis: "x",
            offset: 0,
            keepSide: "less",
            hatchSpacing: "1mm",
          }}
        />
        <assembly.drawing.partview
          partRef=".SHADE"
          name="overview"
          displayName="ISOMETRIC"
          direction="isometric"
          width={85}
          height={85}
          centerX={85}
          centerY={50}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const views = circuit.db.drawing_part_view.list()
  expect(views[2]).toMatchObject({
    direction: "x_positive",
    center: { x: -5, y: -22.5 },
    section: { axis: "x", offset: 0, keep_side: "less", hatch_spacing: 1 },
  })
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
