import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simple route json connection nominalTraceWidth matches trace thickness", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" />
      <capacitor capacitance="1000pF" footprint="0402" name="C1" />
      <trace from="R1.pin1" to="C1.pin1" thickness="0.5mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  const pcbTraceWirePoint = pcbTrace?.route.find((p) => p.route_type === "wire")
  expect(pcbTraceWirePoint?.width).toBe(0.5)

  const circuitJsonWithoutPcbTraces = circuit
    .getCircuitJson()
    .filter((elm) => elm.type !== "pcb_trace")

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
  })

  expect(simpleRouteJson.connections).toHaveLength(1)
  expect(simpleRouteJson.connections[0].nominalTraceWidth).toBe(0.5)
})
