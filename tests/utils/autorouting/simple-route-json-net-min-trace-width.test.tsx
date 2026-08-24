import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net connection minimum width is the strictest source trace minimum", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={4} />
      <net name="SHARED" />
      <trace from="R1.pin1" to="net.SHARED" thickness="0.18mm" />
      <trace from="R2.pin1" to="net.SHARED" thickness="0.42mm" />
      <trace from="R3.pin1" to="net.SHARED" thickness="0.25mm" />
      <pcbnotetext
        text="SHARED hard minimum = max(0.18, 0.42, 0.25) = 0.42mm"
        fontSize={0.45}
        pcbX={0}
        pcbY={-2.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sharedNet = circuit.db.source_net.getWhere({ name: "SHARED" })!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })
  const sharedConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === sharedNet.source_net_id,
  )

  expect(sharedConnection?.pointsToConnect).toHaveLength(3)
  expect(sharedConnection?.minTraceWidth).toBe(0.42)
  expect(sharedConnection?.nominalTraceWidth).toBe(0.42)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
