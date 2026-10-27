import { expect, test } from "bun:test"
import { assembly } from "lib"
import { HolePlate } from "tests/fixtures/assembly-drawing/hole-plate"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("drawing dimensions measure named CAD hole centers and outline edges", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart name="plate" jscad={<HolePlate />} />
      <assembly.drawing.page size="iso_a4">
        <assembly.drawing.titleblock title="NAMED CAD BORES / CENTER SPACING AND EDGE OFFSET" />
        <assembly.drawing.partview
          name="plan"
          displayName="HOLE CENTERS AND EDGE OFFSETS"
          partRef=".plate"
          direction="z+"
          width={80}
          height={60}
          centerX={-55}
          centerY={30}
        >
          <assembly.drawing.dimension
            name="pitch_x"
            fromRef=".plate > .H1"
            toRef=".plate > .H2"
            axis="x"
          />
          <assembly.drawing.dimension
            name="pitch_y"
            fromRef=".plate > .H2"
            toRef=".plate > .H1"
            axis="y"
          />
          <assembly.drawing.dimension
            name="left_offset"
            fromRef=".plate > .rim"
            fromAnchor="left"
            toRef=".plate > .H1"
            axis="x"
          />
          <assembly.drawing.dimension
            name="right_offset"
            fromRef=".plate > .H2"
            toRef=".plate > .rim"
            toAnchor="right"
            axis="x"
          />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const lines = circuit.db.drawing_dimension_line.list()
  expect(lines.map(({ text }) => text)).toEqual([
    "30 mm",
    "14 mm",
    "8 mm",
    "12 mm",
  ])
  const view = circuit.db.drawing_part_view.list()[0]!
  expect(lines[0]!.edge_ref_start!.x).toBeCloseTo(
    view.center.x - 17 * view.scale!,
    4,
  )
  expect(lines[0]!.edge_ref_start!.y).toBeCloseTo(
    view.center.y - 8 * view.scale!,
    4,
  )
  expect(lines[0]!.edge_ref_end!.x).toBeCloseTo(
    view.center.x + 13 * view.scale!,
    4,
  )
  expect(lines[0]!.edge_ref_end!.y).toBeCloseTo(
    view.center.y + 6 * view.scale!,
    4,
  )
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
