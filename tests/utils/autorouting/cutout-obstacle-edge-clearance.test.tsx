import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A cutout becomes a board edge (Edge.Cuts), so routed copper must keep the
// copper-to-edge clearance from it - not merely avoid overlapping it. The
// autorouter routes flush against obstacle boundaries, so a cutout emitted at
// its exact physical size lets traces hug the slot and fail edge-clearance DRC
// at any fab. The obstacle must be inflated by the clearance on every side.
test("cutout obstacles are inflated by the copper-to-edge clearance", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <cutout shape="rect" width="8mm" height="1.2mm" pcbX="0mm" pcbY="0mm" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX="-8mm" />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX="8mm" />
      <trace from=".R1 .pin2" to=".R2 .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.firstChild as {
    selectAll(selector: string): unknown[]
  }
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: board,
  })

  // the cutout obstacle covers all layers and nothing connects to it
  const cutoutObstacle = simpleRouteJson.obstacles.find(
    (o) =>
      o.connectedTo.length === 0 &&
      Math.abs(o.center.x) < 0.01 &&
      Math.abs(o.center.y) < 0.01 &&
      o.width > 8 - 0.01,
  )
  expect(cutoutObstacle).toBeDefined()
  // inflated beyond the physical 8 x 1.2 slot on every side
  expect(cutoutObstacle!.width).toBeGreaterThan(8.01)
  expect(cutoutObstacle!.height).toBeGreaterThan(1.21)
})
