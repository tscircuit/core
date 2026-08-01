import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keepout excludeRefs allows connections to the selected component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="22mm" height="12mm">
      <pcbnotetext
        text="ANT1 feed may enter the keepout"
        pcbX={-10}
        pcbY={5}
        fontSize={0.5}
        anchorAlignment="top_left"
      />
      <testpoint name="SOURCE" footprintVariant="pad" pcbX={-7} pcbY={0} />
      <testpoint name="ANT1" footprintVariant="pad" pcbX={4} pcbY={0} />
      <keepout
        shape="rect"
        width="8mm"
        height="6mm"
        pcbX={4}
        pcbY={0}
        excludeRefs={[".ANT1"]}
      />
      <trace name="ANTENNA_FEED" from=".SOURCE > .pin1" to=".ANT1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.firstChild
  if (!board) throw new Error("Expected a board component")

  const antennaSourceComponent = circuit.db.source_component.getWhere({
    name: "ANT1",
  })
  const antennaPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: antennaSourceComponent!.source_component_id,
  })
  const antennaPad = circuit.db.pcb_smtpad.getWhere({
    pcb_component_id: antennaPcbComponent!.pcb_component_id,
  })
  const antennaFeed = circuit.db.source_trace.getWhere({
    name: "ANTENNA_FEED",
  })
  const keepout = circuit.db.pcb_keepout.list()[0]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: keepout!.subcircuit_id,
    subcircuitComponent: board,
  })
  const keepoutObstacle = simpleRouteJson.obstacles.find(
    (obstacle) => obstacle.obstacleId === keepout!.pcb_keepout_id,
  )

  expect(keepoutObstacle?.connectedTo).toContain(antennaPad!.pcb_smtpad_id)
  expect(keepoutObstacle?.connectedTo).toContain(antennaFeed!.source_trace_id)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
