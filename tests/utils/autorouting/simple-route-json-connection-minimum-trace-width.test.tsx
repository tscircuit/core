import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("preserves the strongest explicit minimum on a net without constraining default widths", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="12mm" nominalTraceWidth="0.3mm" routingDisabled>
      <chip name="U1" footprint="soic16" pcbX={-10} />
      <pinheader name="J1" pinCount={2} pitch="2.54mm" pcbX={11} />
      <capacitor name="C1" capacitance="100nF" footprint="0805" pcbX={7} />
      <trace from=".U1 > .pin1" to="net.MOTOR" thickness="1.2mm" />
      <trace from=".J1 > .pin1" to="net.MOTOR" thickness="0.8mm" />
      <trace from=".C1 > .pin1" to="net.MOTOR" />
      <trace from=".U1 > .pin2" to=".J1 > .pin2" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    nominalTraceWidth: 0.3,
  })

  expect(simpleRouteJson.connections).toHaveLength(2)
  const motorConnection = simpleRouteJson.connections.find(
    (connection) => connection.pointsToConnect.length === 3,
  )
  expect(motorConnection?.minTraceWidth).toBe(1.2)
  expect(motorConnection?.nominalTraceWidth).toBe(1.2)
  const defaultConnection = simpleRouteJson.connections.find(
    (connection) => connection.pointsToConnect.length === 2,
  )
  expect(defaultConnection?.minTraceWidth).toBeUndefined()
  expect(defaultConnection?.nominalTraceWidth).toBe(0.3)
})
