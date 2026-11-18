import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("same-name nets in separate subcircuits keep independent SRJ clearances", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={16} routingDisabled schematicDisabled>
      <subcircuit name="USB" pcbX={-6}>
        <net
          name="DATA"
          minTraceClearance={0.15}
          connectsTo={["R1.pin1", "R2.pin1"]}
        />
        <resistor name="R1" resistance="1k" footprint="0402" pcbY={-3} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbY={3} />
      </subcircuit>
      <subcircuit name="RF" pcbX={6}>
        <net
          name="DATA"
          minTraceClearance={0.3}
          connectsTo={["R1.pin1", "R2.pin1"]}
        />
        <resistor name="R1" resistance="1k" footprint="0402" pcbY={-3} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbY={3} />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  expect(
    simpleRouteJson.connections.map(
      (connection) => connection.minTraceClearance,
    ),
  ).toEqual([0.15, 0.3])
  const dataNets = circuit.db.source_net
    .list()
    .filter((net) => net.name === "DATA")
  expect(
    simpleRouteJson.obstacles
      .filter((obstacle) =>
        obstacle.connectedTo.includes(dataNets[0].source_net_id),
      )
      .map((obstacle) => obstacle.minTraceClearance),
  ).toEqual([0.15, 0.15])
  expect(
    simpleRouteJson.obstacles
      .filter((obstacle) =>
        obstacle.connectedTo.includes(dataNets[1].source_net_id),
      )
      .map((obstacle) => obstacle.minTraceClearance),
  ).toEqual([0.3, 0.3])
})
