import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { renderToJscadPlan } from "jscad-fiber/headless"
import {
  resolveDrawingDimensionGeometry,
  projectDrawingDimensionPoints,
} from "lib/components/primitive-components/resolve-drawing-dimension-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("named witnesses match emitted meshes after CAD translation and quarter-turns on both faces", async () => {
  const { circuit } = getTestFixture()
  const plan = renderToJscadPlan(
    <jscad.translate offset={[3, 2, 0]}>
      <jscad.extrudeLinear height={5} topOutlineName="rim">
        <jscad.rectangle size={[30, 14]} />
      </jscad.extrudeLinear>
    </jscad.translate>,
  )
  circuit.add(
    <assembly.device name="fixture">
      {[0, 90, 180, 270].flatMap((angle, column) =>
        [0, 180].map((flip, row) => {
          const name = `plate_${angle}_${flip}`
          return (
            <assembly.subassembly key={name} name={name}>
              <assembly.part
                name="plate"
                cadModel={{
                  jscad: plan,
                  positionOffset: { x: 17, y: -11, z: 8 },
                  rotationOffset: { x: 0, y: flip, z: angle },
                }}
              />
              <assembly.drawing.page name={`sheet_${name}`} size="iso_a4">
                <assembly.drawing.titleblock
                  title={`Named rim — CAD Z ${angle}°, CAD Y ${flip}°`}
                />
                <assembly.drawing.partview
                  partRef={`.${name} > .plate`}
                  name="plan"
                  displayName="PLAN — witnesses meet the rotated rim"
                  direction="z+"
                  width={90}
                  height={60}
                >
                  <assembly.drawing.dimension edgeRef=".rim" />
                </assembly.drawing.partview>
              </assembly.drawing.page>
            </assembly.subassembly>
          )
        }),
      )}
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const views = circuit.db.drawing_part_view.list()
  const lines = circuit.db.drawing_dimension_line.list()
  for (const view of views) {
    const { points, camera } = await resolveDrawingDimensionGeometry(
      circuit.getCircuitJson(),
      view,
    )
    const samples = projectDrawingDimensionPoints(points, camera, view)
    const line = lines.find(
      (line) => line.drawing_part_view_id === view.drawing_part_view_id,
    )!
    expect(line.text).toBe("30")
    for (const witness of [line.edge_ref_start!, line.edge_ref_end!]) {
      // Compare to the exported mesh itself, not another copy of CAD transforms.
      expect(
        samples.some(
          ({ paper }) =>
            Math.hypot(paper.x - witness.x, paper.y - witness.y) < 0.001,
        ),
      ).toBe(true)
    }
  }
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path, {
    drawingPageId: views[3]!.drawing_page_id,
  })
})
