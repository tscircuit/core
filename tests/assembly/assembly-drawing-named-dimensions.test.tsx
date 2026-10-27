import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("native model outlines resolve relative and qualified refs and stack automatically", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="fixture">
      <assembly.printedpart
        name="housing"
        jscad={
          <jscad.translate offset={[13, -7, 3]}>
            <jscad.rotate angles={[0, 0, Math.PI / 2]}>
              <jscad.union>
                <jscad.extrudeLinear height={4} topOutlineName="base_outline">
                  <jscad.rectangle size={[40, 24]} />
                </jscad.extrudeLinear>
                <jscad.translate offset={[3, 2, 4]}>
                  <jscad.extrudeLinear
                    height={6}
                    topOutlineName="mounting_outline"
                  >
                    <jscad.rectangle size={[20, 12]} />
                  </jscad.extrudeLinear>
                </jscad.translate>
              </jscad.union>
            </jscad.rotate>
          </jscad.translate>
        }
      />
      <assembly.drawing.page name="stepped-plate" size="iso_a4">
        <assembly.drawing.titleblock title="Stepped mounting plate — native outline dimensions (mm)" />
        <assembly.drawing.partview
          partRef=".housing"
          name="plan"
          displayName="PLAN — rotated plate"
          direction="z+"
          width={100}
          height={100}
          centerX={-40}
        >
          <assembly.drawing.dimension widthOfView />
          <assembly.drawing.dimension heightOfView />
          <assembly.drawing.dimension edgeRef=".mounting_outline" />
          <assembly.drawing.dimension edgeRef=".housing > .base_outline" />
        </assembly.drawing.partview>
        <assembly.drawing.partview
          partRef=".housing"
          name="overview"
          displayName="ISOMETRIC"
          direction="isometric"
          width={75}
          height={90}
          centerX={70}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const lines = circuit.db.drawing_dimension_line.list()
  expect(lines.map((line) => line.text)).toEqual(["24", "40", "20", "40"])
  expect(lines.slice(2).map((line) => line.edge_ref_name)).toEqual([
    "mounting_outline",
    "base_outline",
  ])
  expect(lines[2]!.start.x).toBeLessThan(lines[1]!.start.x)
  expect(lines[3]!.start.x).toBeLessThan(lines[2]!.start.x)
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
