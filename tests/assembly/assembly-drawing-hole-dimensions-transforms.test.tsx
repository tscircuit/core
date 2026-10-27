import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("hole witnesses follow finalized footprint rotation and both PCB layers", async () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <assembly.device>
          <board
            name="carrier"
            width={80}
            height={60}
            pcbX={7}
            pcbY={-9}
            routingDisabled
          >
            <chip
              name="J1"
              pcbX={11}
              pcbY={5}
              pcbRotation={rotation}
              layer={layer}
              footprint={
                <footprint>
                  <hole name="H1" diameter={2} pcbX={9} pcbY={3} />
                  <platedhole
                    shape="circle"
                    name="H2"
                    holeDiameter={2}
                    outerDiameter={4}
                    pcbX={-7}
                    pcbY={-5}
                  />
                </footprint>
              }
            />
          </board>
          <assembly.drawing.page size="iso_a4">
            <assembly.drawing.partview
              partRef=".carrier"
              direction="z+"
              width={80}
              height={60}
            >
              <assembly.drawing.dimension
                fromRef=".J1 .H1"
                toRef=".J1 .H2"
                axis="x"
              />
              <assembly.drawing.dimension
                fromRef=".J1 .H1"
                toRef=".J1 .H2"
                axis="y"
              />
            </assembly.drawing.partview>
          </assembly.drawing.page>
        </assembly.device>,
      )
      await circuit.renderUntilSettled()
      const hole = circuit.db.pcb_hole.list()[0]!
      const plated = circuit.db.pcb_plated_hole.list()[0]!
      const view = circuit.db.drawing_part_view.list()[0]!
      const board = circuit.db.pcb_board.list()[0]!
      const lines = circuit.db.drawing_dimension_line.list()
      expect(lines.map(({ text }) => text)).toEqual(
        rotation % 180 === 0 ? ["16 mm", "8 mm"] : ["8 mm", "16 mm"],
      )
      for (const [index, axis] of ["x", "y"].entries()) {
        const ordered = [hole, plated].sort(
          (a, b) => b[axis as "x" | "y"] - a[axis as "x" | "y"],
        )
        for (const [point, pcbHole] of [
          [lines[index]!.edge_ref_start!, ordered[0]!],
          [lines[index]!.edge_ref_end!, ordered[1]!],
        ] as const) {
          // Exporter top-view axes point opposite PCB X/Y. Compare with emitted
          // drill coordinates, after layout, instead of repeating transforms.
          expect(point.x).toBeCloseTo(
            view.center.x + (board.center.x - pcbHole.x) * view.scale!,
            4,
          )
          expect(point.y).toBeCloseTo(
            view.center.y + (board.center.y - pcbHole.y) * view.scale!,
            4,
          )
        }
      }
    }
  }
})
