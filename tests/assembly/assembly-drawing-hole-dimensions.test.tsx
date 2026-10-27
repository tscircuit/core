import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("drawing dimensions measure PCB hole centers and board-edge offsets", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board
        name="carrier"
        width={50}
        height={30}
        pcbX={10}
        pcbY={-5}
        routingDisabled
      >
        <hole name="H1" diameter={3} pcbX={17} pcbY={8} />
        <hole name="H2" diameter={5} pcbX={-13} pcbY={-6} />
        <platedhole
          name="P1"
          holeDiameter={2}
          outerDiameter={4}
          pcbX={-5}
          pcbY={8}
        />
      </board>
      <assembly.drawing.page size="iso_a4">
        <assembly.drawing.titleblock title="HOLE CENTERS / BOARD EDGE OFFSETS" />
        <assembly.drawing.partview
          name="plan"
          displayName="HOLE CENTERS AND EDGE OFFSETS"
          partRef=".carrier"
          direction="z+"
          width={80}
          height={60}
          centerX={-55}
          centerY={30}
        >
          <assembly.drawing.dimension
            name="pitch_x"
            fromRef=".H1"
            toRef=".H2"
            axis="x"
          />
          <assembly.drawing.dimension
            name="pitch_y"
            fromRef=".H1"
            toRef=".H2"
            axis="y"
          />
          <assembly.drawing.dimension
            name="left_offset"
            fromRef=".carrier"
            fromAnchor="left"
            toRef=".H1"
            axis="x"
          />
          <assembly.drawing.dimension
            name="top_offset"
            fromRef=".H2"
            toRef=".carrier"
            toAnchor="top"
            axis="y"
          />
          <assembly.drawing.dimension
            name="plated_pitch"
            fromRef=".H1"
            toRef=".P1"
          />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const lines = circuit.db.drawing_dimension_line.list()
  expect(lines.map(({ name, text }) => [name, text])).toEqual([
    ["pitch_x", "30 mm"],
    ["pitch_y", "14 mm"],
    ["left_offset", "8 mm"],
    ["top_offset", "9 mm"],
    ["plated_pitch", "22 mm"],
  ])
  const view = circuit.db.drawing_part_view.list()[0]!
  const holes = circuit.db.pcb_hole.list()
  const board = circuit.db.pcb_board.list()[0]!
  // Check witness attachment against finalized PCB geometry, independently of
  // the selector/anchor implementation (page +X right/+Y up, physical mm).
  for (const [point, hole] of [
    [lines[0]!.edge_ref_start!, holes[0]!],
    [lines[0]!.edge_ref_end!, holes[1]!],
  ] as const) {
    expect(point.x).toBeCloseTo(
      view.center.x + (board.center.x - hole.x) * view.scale!,
      4,
    )
    expect(point.y).toBeCloseTo(
      view.center.y + (board.center.y - hole.y) * view.scale!,
      4,
    )
  }
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
