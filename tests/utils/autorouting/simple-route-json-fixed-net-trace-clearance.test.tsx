import { expect, test } from "bun:test"
import { Group_filterSimpleRouteJsonForPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { Net } from "lib/components/primitive-components/Net"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fixed traces and obstacle-only nets keep clearance when routing another net", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={16} routingDisabled schematicDisabled>
      <net
        name="SIGNAL"
        minTraceClearance={0.15}
        connectsTo={["R1.pin1", "R2.pin1"]}
      />
      <net name="PAD_ONLY" minTraceClearance={0.4} connectsTo="R1.pin2" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={8} />
      <subcircuit name="FIXED" pcbY={4}>
        <net name="RF" minTraceClearance={0.3} connectsTo="R3.pin1" />
        <resistor name="R3" resistance="1k" footprint="0402" pcbX={-5} />
        <resistor name="R4" resistance="1k" footprint="0402" pcbX={5} />
        <trace from="R3.pin1" to="R4.pin1" pcbStraightLine thickness={0.25} />
        <via
          name="V1"
          pcbX={0}
          pcbY={2}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter={0.3}
          outerDiameter={0.6}
        />
        <trace from="net.RF" to="V1.top" />
      </subcircuit>
      <pcbnotetext
        pcbY={7}
        fontSize={0.4}
        text="RF fixed trace + via: 0.30 mm min"
      />
      <pcbnotetext pcbY={2} fontSize={0.4} text="SIGNAL: 0.15 mm min" />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.4}
        text="R1 pin2: PAD_ONLY, 0.40 mm min"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: circuit.db.source_net.getWhere({ name: "SIGNAL" })!
      .subcircuit_id,
  })
  expect(simpleRouteJson.connections).toHaveLength(1)
  expect(simpleRouteJson.connections[0].minTraceClearance).toBe(0.15)
  expect(simpleRouteJson.traces).toHaveLength(1)
  expect(simpleRouteJson.traces![0].minTraceClearance).toBe(0.3)
  expect(simpleRouteJson.traces![0].route).toMatchObject([
    { route_type: "wire", width: 0.25 },
    { route_type: "wire", width: 0.25 },
  ])
  const padOnlyNet = circuit.db.source_net.getWhere({ name: "PAD_ONLY" })!
  const padOnlyObstacles = simpleRouteJson.obstacles.filter((obstacle) =>
    obstacle.connectedTo.includes(padOnlyNet.source_net_id),
  )
  expect(padOnlyObstacles).toHaveLength(1)
  expect(padOnlyObstacles[0].minTraceClearance).toBe(0.4)
  const viaId = circuit.db.pcb_via.list()[0].pcb_via_id
  const viaObstacle = simpleRouteJson.obstacles.find(
    (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id === viaId,
  )
  expect(viaObstacle).toMatchObject({
    minTraceClearance: 0.3,
    layers: ["top", "bottom"],
    width: 0.6,
    height: 0.6,
  })

  const phaseInput = Group_filterSimpleRouteJsonForPhase(simpleRouteJson, {
    routingPhaseIndex: 0,
    nets: [circuit.selectOne("net.SIGNAL") as Net],
    traces: [],
  })
  expect(phaseInput.connections).toHaveLength(1)
  expect(phaseInput.connections[0].minTraceClearance).toBe(0.15)
  expect(phaseInput.obstacles).toEqual(simpleRouteJson.obstacles)
  expect(phaseInput.traces).toEqual(simpleRouteJson.traces)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
