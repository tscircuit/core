import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ReferenceSurfaceLamp } from "./fixtures/reference-surface-lamp"

test("desk lamp general arrangement draws the mounted assembly in aligned third-angle views", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <ReferenceSurfaceLamp>
      <assembly.drawing.page name="lamp-general-arrangement" size="iso_a3">
        <assembly.drawing.titleblock
          title="DESK LAMP - GENERAL ARRANGEMENT"
          identificationNumber="LMP-001-GA"
          revisionIndex="A"
          legalOwner="tscircuit"
          creator="tscircuit"
          approvalPerson="PRELIMINARY"
          dateOfIssue="2026-10-21"
          sheetNumber={1}
          numberOfSheets={1}
        />
        {/* Third-angle: top above front, right elevation to its right.
            72 x 72 x 112 mm assembly; viewport ratios preserve matching fit. */}
        <assembly.drawing.partview
          partRef=".LAMP"
          name="front"
          displayName="FRONT ELEVATION"
          direction="y-"
          width={90}
          height={140}
          centerX={-105}
          centerY={-20}
        />
        <assembly.drawing.partview
          partRef=".LAMP"
          name="top"
          displayName="TOP VIEW"
          direction="z+"
          width={90}
          height={90}
          centerX={-105}
          aboveRef=".front"
        />
        <assembly.drawing.partview
          partRef=".LAMP"
          name="right"
          displayName="RIGHT ELEVATION"
          direction="x+"
          width={90}
          height={140}
          rightOfRef=".front"
          centerY={-20}
        />
        <assembly.drawing.partview
          partRef=".LAMP"
          name="overview"
          displayName="ASSEMBLED ISOMETRIC"
          direction="isometric"
          width={115}
          height={180}
          centerX={105}
          centerY={25}
        />
      </assembly.drawing.page>
    </ReferenceSurfaceLamp>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.drawing_page.list()[0]).toMatchObject({
    name: "lamp-general-arrangement",
    width: 420,
    height: 297,
    page_size: "iso_a3",
    orientation: "landscape",
  })
  const sources = circuit.db.source_component
    .list()
    .filter((part) =>
      ["BASE", "STEM", "BULB", "SHADE"].includes(part.name ?? ""),
    )
  expect(sources).toHaveLength(4)
  const views = circuit.db.drawing_part_view.list()
  for (const view of views) {
    expect(new Set(view.source_component_ids)).toEqual(
      new Set(sources.map((part) => part.source_component_id)),
    )
  }
  expect(views.map((view) => view.center)).toEqual([
    { x: -105, y: -20 },
    { x: -105, y: 95 },
    { x: -15, y: -20 },
    { x: 105, y: 25 },
  ])
  const before = structuredClone(circuit.getCircuitJson())
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
  expect(circuit.getCircuitJson()).toEqual(before)
  circuit.render()
  expect(circuit.db.drawing_part_view.list()).toHaveLength(4)
})
