import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Controller from "./stm32f405-differential-pair/index.circuit"

test("STM32F405 USB differential pair resolves named nets", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Controller routingDisabled />)
  await circuit.renderUntilSettled()
  const board = circuit.firstChild
  if (!board) throw new Error("Expected the STM32F405 board")

  // Routing-input conversion does not change the board placement.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: board,
    fanoutPourNetMap: { inner1: "GND", inner2: "V3_3" },
  })
  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [
        circuit.db.source_net.getWhere({ name: "USB_DP" })!.source_net_id,
        circuit.db.source_net.getWhere({ name: "USB_DM" })!.source_net_id,
      ],
      lengthTolerance: 0.5,
      traceGap: 0.15,
    },
  ])
  for (const connectionName of simpleRouteJson.differentialPairs![0]!
    .connectionNames) {
    const connection = simpleRouteJson.connections.find(
      (connection) => connection.name === connectionName,
    )!
    expect(connection.pointsToConnect).toHaveLength(2)
    expect(connection.source_trace_ids).toHaveLength(2)
  }
})
