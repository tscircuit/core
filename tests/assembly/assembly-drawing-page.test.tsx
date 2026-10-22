import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("drawing page emits selected geometry, sections and ISO title-block metadata", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="DEVICE">
      <assembly.printedpart
        name="housing"
        jscad={
          <jscad.subtract>
            <jscad.cuboid size={[24, 16, 10]} />
            <jscad.cylinder radius={4} height={12} />
          </jscad.subtract>
        }
      />
      <assembly.part
        name="unselected"
        cadModel={{ jscad: { type: "cuboid", size: [80, 80, 80] } }}
      />
      <assembly.drawing.page name="housing-drawing" size="iso_a4">
        <assembly.drawing.titleblock
          title="Housing — plan, section and isometric"
          identificationNumber="H-001"
          revisionIndex="A"
          legalOwner="tscircuit"
          creator="Designer"
          sheetNumber={1}
          numberOfSheets={1}
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="plan"
          displayName="PLAN"
          direction="z+"
          width={80}
          height={60}
          centerX={-45}
          centerY={60}
          showHiddenEdges
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="section"
          displayName="A–A"
          direction="x+"
          width={80}
          height={60}
          centerX={45}
          centerY={60}
          section={{
            axis: "x",
            offset: "5mm",
            keepSide: "less",
            hatchSpacing: "1mm",
          }}
        />
        <assembly.drawing.partview
          partRef=".housing"
          name="overview"
          displayName="ISOMETRIC"
          direction="isometric"
          width={160}
          height={80}
          centerY={-20}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.drawing_page.list()[0]).toMatchObject({
    name: "housing-drawing",
    width: 297,
    height: 210,
    page_size: "iso_a4",
    orientation: "landscape",
  })
  const source = circuit.db.source_component
    .list()
    .find((part) => part.name === "housing")!
  const views = circuit.db.drawing_part_view.list()
  expect(views.map((view) => view.source_component_ids)).toEqual([
    [source.source_component_id],
    [source.source_component_id],
    [source.source_component_id],
  ])
  expect(views[1]).toMatchObject({
    direction: "x_positive",
    center: { x: 45, y: 60 },
    section: { axis: "x", offset: 5, keep_side: "less", hatch_spacing: 1 },
  })
  expect(views.every((view) => view.scale === undefined)).toBe(true)
  const before = structuredClone(circuit.getCircuitJson())
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
  expect(circuit.getCircuitJson()).toEqual(before)
  circuit.render()
  expect(circuit.db.drawing_part_view.list()).toHaveLength(3)
})
