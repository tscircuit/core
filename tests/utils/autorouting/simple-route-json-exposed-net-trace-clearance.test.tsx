import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("child routing inherits the stricter clearance of an exposed parent net", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={12} routingDisabled schematicDisabled>
      <net name="VCC" minTraceClearance={0.4} />
      <subcircuit name="POWER" exposedNets={["VCC"]}>
        <net
          name="VCC"
          minTraceClearance={0.15}
          connectsTo={["R1.pin1", "R2.pin1"]}
        />
        <net
          name="DATA"
          minTraceClearance={0.2}
          connectsTo={["R1.pin2", "R2.pin2"]}
        />
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  const childGroup = circuit.db.source_group.getWhere({ name: "POWER" })!
  const childVcc = circuit.db.source_net.getWhere({
    name: "VCC",
    subcircuit_id: childGroup.subcircuit_id,
  })!
  const dataNet = circuit.db.source_net.getWhere({ name: "DATA" })!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: childGroup.subcircuit_id,
  })
  expect(
    simpleRouteJson.connections.find(
      (connection) => connection.name === childVcc.source_net_id,
    )?.minTraceClearance,
  ).toBe(0.4)
  expect(
    simpleRouteJson.connections.find(
      (connection) => connection.name === dataNet.source_net_id,
    )?.minTraceClearance,
  ).toBe(0.2)
  expect(
    simpleRouteJson.obstacles
      .filter((obstacle) =>
        obstacle.connectedTo.includes(childVcc.source_net_id),
      )
      .map((obstacle) => obstacle.minTraceClearance),
  ).toEqual([0.4, 0.4])
  expect(
    simpleRouteJson.obstacles
      .filter((obstacle) =>
        obstacle.connectedTo.includes(dataNet.source_net_id),
      )
      .map((obstacle) => obstacle.minTraceClearance),
  ).toEqual([0.2, 0.2])
})
