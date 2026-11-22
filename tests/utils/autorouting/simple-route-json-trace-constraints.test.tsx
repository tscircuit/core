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
  const direct = simpleRouteJson.connections.find(
    (c) => c.pointsToConnect.length === 2,
  )!
  expect(net.traceConstraints).toEqual([
    {
      sourceTraceId: "source_trace_0",
      pointIds: [net.pointsToConnect[0]!.pointId],
      maxLength: 10,
      maxViaCount: 0,
    },
    {
      sourceTraceId: "source_trace_1",
      pointIds: [net.pointsToConnect[1]!.pointId],
      maxLength: 3,
    },
  ])
  expect(direct.traceConstraints).toEqual([
    {
      sourceTraceId: "source_trace_3",
      pointIds: direct.pointsToConnect.map((point) => point.pointId),
      maxViaCount: 1,
    },
  ])
})
