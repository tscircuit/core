import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("panel routing uses panel bounds and includes panelization obstacles", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      width={40}
      height={20}
      pcbX={10}
      pcbY={5}
      layoutMode="grid"
      col={2}
      panelizationMethod="tab-routing"
    >
      <board name="B1" width={10} height={10}>
        <resistor name="R1" resistance="1k" footprint="0805" />
      </board>
      <board name="B2" width={10} height={10}>
        <resistor name="R2" resistance="1k" footprint="0805" />
      </board>
      <trace
        name="panel_link"
        from=".B1 .R1 .pin2"
        to=".B2 .R2 .pin1"
        pcbStraightLine
      />
    </panel>,
  )
  await circuit.renderUntilSettled()
  const panel = circuit.db.pcb_panel.list()[0]!
  const sourceTrace = circuit.db.source_trace.list()[0]!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: sourceTrace.subcircuit_id,
    pcb_panel_id: panel.pcb_panel_id,
  })
  expect(simpleRouteJson.bounds).toEqual({
    minX: -10,
    maxX: 30,
    minY: -5,
    maxY: 15,
  })
  const cutouts = circuit.db.pcb_cutout.list()
  const holes = circuit.db.pcb_hole.list()
  expect(cutouts.length).toBeGreaterThan(0)
  expect(holes.length).toBeGreaterThan(0)
  const obstacleIds = simpleRouteJson.obstacles.map((o) => o.obstacleId)
  for (const cutout of cutouts) {
    if (cutout.shape !== "rect")
      throw new Error("Expected rectangular tab cutout")
    expect(simpleRouteJson.obstacles).toContainEqual(
      expect.objectContaining({
        center: cutout.center,
        width: cutout.width,
        height: cutout.height,
        connectedTo: [],
      }),
    )
  }
  for (const hole of holes) expect(obstacleIds).toContain(hole.pcb_hole_id)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
