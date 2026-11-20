import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("thickness on a single point-to-point trace does not widen other traces on the same net (#5526)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-10} pcbY={5} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={10} pcbY={5} />
      <resistor name="R3" resistance="1k" footprint="0603" pcbX={-10} pcbY={-5} />
      <resistor name="R4" resistance="1k" footprint="0603" pcbX={10} pcbY={-5} />
      <trace from="R1.pin2" to="R2.pin1" thickness="0.8mm" />
      <trace from="R3.pin2" to="net.VBUS" />
      <trace from="R4.pin1" to="net.VBUS" />
      <trace from="R1.pin2" to="net.VBUS" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJsonWithoutPcbTraces = circuit
    .getCircuitJson()
    .filter((elm) => elm.type !== "pcb_trace")

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
  })

  const thickConn = simpleRouteJson.connections.find(
    (c) => c.nominalTraceWidth === 0.8,
  )
  const netConn = simpleRouteJson.connections.find(
    (c) => c.nominalTraceWidth !== 0.8,
  )

  expect(thickConn).toBeDefined()
  expect(netConn).toBeDefined()
  expect(netConn!.nominalTraceWidth).toBeLessThan(0.8)
})
