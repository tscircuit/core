import { expect, test } from "bun:test"
import { assembly } from "lib"
import { ExtrudeLinear, Rectangle, Subtract } from "jscad-fiber/model"
import { drawing_dimension_line } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function Tube() {
  return (
    <Subtract>
      <ExtrudeLinear
        height={80}
        topOutlineName="outer_top"
        bottomOutlineName="outer_bottom"
      >
        <Rectangle size={[40, 20]} />
      </ExtrudeLinear>
      <ExtrudeLinear
        height={80}
        topOutlineName="inner_top"
        bottomOutlineName="inner_bottom"
      >
        <Rectangle size={[34, 14]} />
      </ExtrudeLinear>
    </Subtract>
  )
}

test("drawing dimensions measure named bore outlines and view extents in physical mm", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart name="tube" jscad={<Tube />} />
      <assembly.drawing.page size="iso_a4" name="tube-dimensions">
        <assembly.drawing.titleblock title="TUBE — 40 × 20 × 80 mm, 3 mm WALL" />
        <assembly.drawing.partview
          name="end"
          displayName="END / BORE AND OUTER EXTENTS"
          partRef=".tube"
          direction="z+"
          width={80}
          height={55}
          centerX={-60}
          centerY={35}
        >
          <assembly.drawing.dimension
            name="bore"
            edgeRef=".tube > .inner_top"
          />
          <assembly.drawing.dimension name="width" widthOfView />
          <assembly.drawing.dimension name="height" heightOfView />
        </assembly.drawing.partview>
        <assembly.drawing.partview
          name="side"
          displayName="SIDE / PHYSICAL HEIGHT"
          partRef=".tube"
          direction="y-"
          width={50}
          height={85}
          centerX={35}
          centerY={25}
        >
          <assembly.drawing.dimension name="length" heightOfView />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const dimensions = circuit.db.drawing_dimension_line.list()
  expect(
    dimensions.map((dimension) => [dimension.name, dimension.text]),
  ).toEqual([
    ["bore", "34 mm"],
    ["width", "40 mm"],
    ["height", "20 mm"],
    ["length", "80 mm"],
  ])
  for (const dimension of dimensions)
    expect(drawing_dimension_line.safeParse(dimension).success).toBe(true)
  const bore = dimensions[0]!
  expect(bore.edge_ref_name).toBe("inner_top")
  expect(bore.end.x - bore.start.x).not.toBeCloseTo(34)
  expect(bore.edge_ref_start!.x).toBeCloseTo(bore.start.x)
  expect(bore.edge_ref_end!.x).toBeCloseTo(bore.end.x)
  expect(circuit.selectOne(".bore")!._parsedProps).toEqual({
    name: "bore",
    edgeRef: ".tube > .inner_top",
  })
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
