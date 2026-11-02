import { expect, test } from "bun:test"
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
      {Array.from({ length: 9 }, (_, boardIndex) => (
        <board key={boardIndex} width="14mm" height="18mm" schematicDisabled>
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
          <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={2} />
          <trace from=".R1 > .pin2" to=".C1 > .pin1" />
          <pcbnotetext
            text="3 mm tab / 0.63 mm drill"
            fontSize={0.6}
            pcbY={5}
          />
        </board>
      ))}
    </panel>,
  )
  await circuit.renderUntilSettled()
  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole) => hole.hole_shape === "circle")
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
  expect(holes).toHaveLength(108)
})
