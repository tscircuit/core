import { expect, test } from "bun:test"
import { computeClearanceBetweenElements } from "@tscircuit/circuit-json-util"
import type { PcbHoleCircle } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("small panel boards keep mouse bites clear of fixed copper and edge text", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      col={1}
      boardGap="2mm"
      edgePadding="3mm"
      panelizationMethod="tab-routing"
      tabWidth="2mm"
      tabLength="3mm"
    >
      {["TOP", "BOTTOM"].map((name) => (
        <board key={name} width="10.4mm" height="6mm" schematicDisabled>
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={-3.5}
            pcbY={1.5}
          />
          <resistor
            name="R2"
            resistance="1k"
            footprint="0402"
            pcbX={3.5}
            pcbY={1.5}
          />
          <trace
            from=".R1 > .pin2"
            to=".R2 > .pin1"
            thickness="0.15mm"
            pcbPath={[
              { x: 0.51, y: 1.05 },
              { x: 6.49, y: 1.05 },
            ]}
          />
          <silkscreentext
            text="VCC"
            pcbX={4}
            pcbY={0.1}
            fontSize={0.8}
            anchorAlignment="center"
          />
          <pcbnotetext text={`${name}: FIXED EDGE TRACE`} fontSize={0.4} />
          <pcbnotetext
            text="EXPECT: 0.5 mm DRILL / 0.8 mm PITCH"
            fontSize={0.32}
            pcbY={-1.4}
          />
          <pcbnotetext
            text="KEEP COPPER + VCC CLEAR"
            fontSize={0.32}
            pcbY={-2.1}
          />
        </board>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
  expect(holes).toHaveLength(28)
  for (const [holeIndex, hole] of holes.entries()) {
    expect(hole.hole_diameter).toBeGreaterThanOrEqual(0.5)
    for (const otherHole of holes.slice(holeIndex + 1)) {
      expect(
        computeClearanceBetweenElements(hole, otherHole),
      ).toBeGreaterThanOrEqual(0.3 - 1e-6)
    }
    for (const trace of circuit.db.pcb_trace.list()) {
      expect(
        computeClearanceBetweenElements(hole, trace),
      ).toBeGreaterThanOrEqual(0.2 - 1e-6)
    }
  }

  for (const board of circuit.db.pcb_board.list()) {
    // These positions are circuit-world mm (+X right/+Y up, +Z above).
    // The VCC glyphs extend to x = board.center.x + 5.095 in KiCad's stroke
    // font. Both drill rows must remain, with the inner row clear of the ink.
    const rightTabHoles = holes.filter(
      (hole) =>
        hole.x > board.center.x + 5 && Math.abs(hole.y - board.center.y) < 1,
    )
    expect(rightTabHoles).toHaveLength(4)
    expect(
      rightTabHoles.filter(
        (hole) => Math.abs(hole.x - board.center.x - 6.3) < 1e-6,
      ),
    ).toHaveLength(2)
    for (const hole of rightTabHoles) {
      expect(hole.x - hole.hole_diameter / 2).toBeGreaterThan(
        board.center.x + 5.095,
      )
    }

    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuit_id: board.subcircuit_id,
    })
    const obstacleIds = simpleRouteJson.obstacles.map(
      (obstacle) => obstacle.obstacleId,
    )
    for (const hole of holes.filter(
      (hole) =>
        Math.abs(hole.x - board.center.x) < 5.7 &&
        Math.abs(hole.y - board.center.y) < 3.5,
    )) {
      expect(obstacleIds).toContain(hole.pcb_hole_id)
    }
  }
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
