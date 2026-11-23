import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SRJ preserves individual trace limits when terminals share a net", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={0} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={3} />
      <trace from="R1.pin1" to="net.CLK" maxLength="10mm" maxViaCount={0} />
      <trace from="R2.pin1" to="net.CLK" maxLength="3mm" />
      <trace from="R3.pin1" to="net.CLK" />
      <trace from="R1.pin2" to="R2.pin2" maxViaCount={1} />
    </board>,
  )
  circuit.render()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })
  const net = simpleRouteJson.connections.find(
    (c) => c.pointsToConnect.length === 3,
  )!
  expect(net.maxLength).toBeUndefined()
  expect(net.maxViaCount).toBeUndefined()
  const branches = simpleRouteJson.connections.filter(
    (c) => c.netConnectionName === net.name,
  )
  expect(
    branches.map((c) => ({
      terminals: c.pointsToConnect.map((p) => p.pointId),
      length: c.maxLength,
      vias: c.maxViaCount,
    })),
  ).toEqual([
    { terminals: [net.pointsToConnect[0]!.pointId], length: 10, vias: 0 },
    {
      terminals: [net.pointsToConnect[1]!.pointId],
      length: 3,
      vias: undefined,
    },
  ])
  const direct = simpleRouteJson.connections.find(
    (c) => c.source_trace_id === "source_trace_3",
  )!
  expect(direct.pointsToConnect).toHaveLength(2)
  expect(direct.maxViaCount).toBe(1)
  expect(direct.maxLength).toBeUndefined()
})
