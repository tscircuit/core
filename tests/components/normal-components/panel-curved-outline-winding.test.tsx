import { expect, test } from "bun:test"
import { point, Polygon } from "@flatten-js/core"
import { applyToPoint, rotateDEG } from "transformation-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("curved panel slots stay outside clockwise and counterclockwise boards", async () => {
  const { circuit } = getTestFixture()
  const outline = Array.from({ length: 64 }, (_, vertexIndex) =>
    applyToPoint(rotateDEG((vertexIndex * 360) / 64), { x: 8, y: 0 }),
  )
  circuit.add(
    <panel
      layoutMode="grid"
      row={1}
      col={2}
      boardGap="3mm"
      panelizationMethod="tab-routing"
    >
      <board outline={outline} routingDisabled>
        <pcbnotetext text="CCW curved outline" fontSize={0.8} />
      </board>
      <board outline={[...outline].reverse()} routingDisabled>
        <pcbnotetext text="CW curved outline" fontSize={0.8} />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const cutouts = circuit.db.pcb_cutout.list()
  expect(cutouts).toHaveLength(8)
  for (const cutout of cutouts) {
    expect(cutout.shape).toBe("polygon")
    if (cutout.shape !== "polygon") continue
    expect(
      cutout.points.every(
        (position) =>
          Number.isFinite(position.x) && Number.isFinite(position.y),
      ),
    ).toBe(true)
    const slot = new Polygon(
      cutout.points.map((position) => point(position.x, position.y)),
    )
    expect(slot.isValid()).toBe(true)
    for (const board of circuit.db.pcb_board.list())
      expect(slot.contains(point(board.center.x, board.center.y))).toBe(false)
  }
})
