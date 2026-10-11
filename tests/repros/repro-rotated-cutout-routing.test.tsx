import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing preserves rectangular cutout rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} schAutoLayoutEnabled routingDisabled>
      <pinheader name="J1" pinCount={1} pcbX={-4} pcbY={1.3} />
      <pinheader name="J2" pinCount={1} pcbX={4} pcbY={1.3} />
      <trace from=".J1 > .pin1" to=".J2 > .pin1" />
      <pcbnotetext
        text="Copper must avoid the diagonal opening"
        pcbY={-3}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  // Insert valid cutout JSON to isolate routing from TSX cutout rendering.
  circuit.db.pcb_cutout.insert({
    shape: "rect",
    center: { x: 0, y: 0 },
    width: 4,
    height: 1,
    rotation: 45,
    subcircuit_id: circuit.db.pcb_board.list()[0]!.subcircuit_id,
  })
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  const traces = new TscircuitAutorouter(simpleRouteJson).solveSync()
  await expect([...circuit.getCircuitJson(), ...traces]).toMatchPcbSnapshot(
    import.meta.path,
    { showPcbNotes: true },
  )
  expect(traces).toHaveLength(1)
  const cutoutObstacle = simpleRouteJson.obstacles.find(
    ({ center }) => center.x === 0 && center.y === 0,
  )!
  expect(cutoutObstacle.ccwRotationDegrees).toBe(45)
})
