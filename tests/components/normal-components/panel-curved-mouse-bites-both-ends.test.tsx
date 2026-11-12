import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyToPoint, rotateDEG } from "transformation-matrix"

test("curved tabs have inner and outer drill rows in either outline winding", async () => {
  const { circuit } = getTestFixture()
  const outline = Array.from({ length: 64 }, (_, vertexIndex) =>
    applyToPoint(rotateDEG((vertexIndex * 360) / 64), { x: 10, y: 0 }),
  )
  circuit.add(
    <panel
      layoutMode="grid"
      col={2}
      boardGap={10}
      panelizationMethod="tab-routing"
    >
      <board width={20} height={20} outline={outline} routingDisabled>
        <pcbnotetext text="CCW / TWO ROWS" fontSize={1} />
      </board>
      <board
        width={20}
        height={20}
        outline={[...outline].reverse()}
        routingDisabled
      >
        <pcbnotetext text="CW / TWO ROWS" fontSize={1} />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  for (const board of circuit.db.pcb_board.list()) {
    const distances = circuit.db.pcb_hole
      .list()
      .filter((hole) => hole.hole_shape === "circle")
      .map((hole) =>
        Math.hypot(hole.x - board.center.x, hole.y - board.center.y),
      )
    // The 64-chord circle has at most 0.013 mm radial sag. Both outlines
    // retain 16 inner-edge holes and 16 holes at the 2 mm channel's outer edge.
    expect(
      distances.filter((distance) => Math.abs(distance - 10) < 0.02),
    ).toHaveLength(16)
    expect(
      distances.filter((distance) => Math.abs(distance - 12) < 0.02),
    ).toHaveLength(16)
  }
})
