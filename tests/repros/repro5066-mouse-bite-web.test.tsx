import { expect, test } from "bun:test"
import type { PcbHoleCircle } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mouse-bite rows use the requested tab span and leave a drillable web", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      row={3}
      col={3}
      boardGap="2mm"
      panelizationMethod="tab-routing"
      tabLength="3mm"
    >
      {["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"].map(
        (cellName) => (
          <board key={cellName} width="14mm" height="18mm" schematicDisabled>
            <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
            <capacitor
              name="C1"
              capacitance="100nF"
              footprint="0402"
              pcbX={2}
            />
            <trace from=".R1 > .pin2" to=".C1 > .pin1" />
            <pcbnotetext
              text="3 mm tab / 0.63 mm drill"
              fontSize={0.6}
              pcbY={5}
            />
          </board>
        ),
      )}
    </panel>,
  )
  await circuit.renderUntilSettled()
  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
  let minimumWeb = Number.POSITIVE_INFINITY
  for (let holeIndex = 0; holeIndex < holes.length; holeIndex++) {
    const hole = holes[holeIndex]!
    for (const otherHole of holes.slice(holeIndex + 1)) {
      minimumWeb = Math.min(
        minimumWeb,
        Math.hypot(hole.x - otherHole.x, hole.y - otherHole.y) -
          (hole.hole_diameter + otherHole.hole_diameter) / 2,
      )
    }
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  // Ray's native KiCad DRC uses ~0.25 mm drill clearance. This is a
  // regression threshold for that fixture, not a universal fab requirement.
  expect(minimumWeb).toBeGreaterThanOrEqual(0.25)
  // Shared board edges reuse the neighboring row. The 12 outer edges each
  // gain a three-drill frame-side row: 108 existing + 36 opposite-end holes.
  expect(holes).toHaveLength(144)
})
