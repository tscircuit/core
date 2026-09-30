import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("circle keepout becomes one rectangular SRJ obstacle", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={18} height={10} autorouter="default" schematicDisabled>
      <testpoint name="TP1" footprintVariant="pad" pcbX={-7} pcbY={0} />
      <testpoint name="TP2" footprintVariant="pad" pcbX={7} pcbY={0} />
      <trace from=".TP1 > .pin1" to=".TP2 > .pin1" />
      <keepout
        shape="circle"
        radius={2}
        pcbX={0}
        pcbY={0}
        layers={["top", "bottom"]}
      />
      <pcbnotetext
        text="Circle keepout routes as one 4x4mm SRJ square"
        pcbY={4}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: circuit.db.pcb_board.list()[0]!.subcircuit_id,
  })
  const keepoutObstacle = simpleRouteJson.obstacles.find(
    (obstacle) =>
      obstacle.center.x === 0 &&
      obstacle.center.y === 0 &&
      obstacle.connectedTo.length === 0,
  )

  expect(keepoutObstacle).toMatchObject({
    type: "rect",
    layers: ["top", "bottom"],
    center: { x: 0, y: 0 },
    width: 4,
    height: 4,
    connectedTo: [],
  })
  expect(keepoutObstacle?.shape).toBeUndefined()
  expect(circuit.db.pcb_trace.list()[0]?.route.length).toBeGreaterThan(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
