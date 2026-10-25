import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import RgmiiPhyBoard from "tests/fixtures/rgmii-phy-board/index.circuit"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("the original RGMII PHY board loses crystal limits in its routing input", async () => {
  const { circuit } = getTestFixture({
    platform: { routingDisabled: true, partsEngineDisabled: true },
  })
  circuit.add(<RgmiiPhyBoard />)
  await circuit.renderUntilSettled()

  const board = circuit.children[0]
  if (!(board instanceof Board)) throw new Error("Expected the original PHY board")
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    subcircuit_id: board.subcircuit_id,
    subcircuitComponent: board,
    minTraceWidth: 0.15,
    nominalTraceWidth: 0.18,
  })

  expect(circuit.db.pcb_board.list()[0]).toMatchObject({
    width: 90,
    height: 70,
    num_layers: 4,
  })
  expect(circuit.db.source_component.list()).toHaveLength(48)
  expect(circuit.db.pcb_component.list()).toHaveLength(57)
  expect(simpleRouteJson.connections).toHaveLength(45)
  expect(simpleRouteJson.obstacles).toHaveLength(496)
  expect(simpleRouteJson.differentialPairs).toHaveLength(4)
  expect(simpleRouteJson.buses).toHaveLength(2)

  const phy = circuit.db.source_component.getWhere({ name: "U1" })!
  const crystal = circuit.db.source_component.getWhere({ name: "Y1" })!
  const phyXo = circuit.db.source_port.getWhere({
    source_component_id: phy.source_component_id,
    name: "XO",
  })!
  const crystalXo = circuit.db.source_port.getWhere({
    source_component_id: crystal.source_component_id,
    name: "pin3",
  })!
  const sourceTrace = circuit.db.source_trace.list().find((trace) =>
    trace.connected_source_port_ids.includes(phyXo.source_port_id) &&
    trace.connected_source_port_ids.includes(crystalXo.source_port_id),
  )!
  expect(sourceTrace).toMatchObject({ max_length: 10, max_via_count: 0 })
  const connection = simpleRouteJson.connections.find(
    (candidate) => candidate.source_trace_id === sourceTrace.source_trace_id,
  )!
  expect(connection).toBeDefined()
  // Characterize the missing limits; update these assertions when they are forwarded.
  expect(connection).not.toHaveProperty("max_length")
  expect(connection).not.toHaveProperty("max_via_count")
  expect(connection).not.toHaveProperty("maxLength")
  expect(connection).not.toHaveProperty("maxViaCount")

  // Native placement and ratsnest only: no routed copper is injected into the board.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    width: 1400,
    height: 1100,
  })
})
