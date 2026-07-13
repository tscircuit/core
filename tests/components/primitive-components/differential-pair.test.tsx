import { expect, it } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("registers a differential pair routing constraint", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={-2}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-4} pcbY={2} />
      <led name="LED1" footprint="0402" pcbX={6} pcbY={-2} />
      <led name="LED2" footprint="0402" pcbX={6} pcbY={2} />
      <trace name="USB_P" from=".R1 > .pin1" to=".LED1 > .anode" />
      <trace name="USB_N" from=".R2 > .pin1" to=".LED2 > .anode" />
      <pcbnotetext
        pcbX={0}
        pcbY={0}
        fontSize={1}
        text="USB differential pair: USB_P / USB_N (max skew: 0.05)"
      />
    </board>,
  )

  circuit.render()

  const circuitJsonWithoutPcbTraces = circuit
    .getCircuitJson()
    .filter((element) => element.type !== "pcb_trace")
  const subcircuitComponent = circuit.firstChild
  if (!subcircuitComponent) {
    throw new Error("Expected the circuit to contain a board")
  }
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
    subcircuitComponent,
  })
  const positiveTrace = circuit.db.source_trace.getWhere({ name: "USB_P" })
  if (!positiveTrace) {
    throw new Error("Expected the USB_P source trace")
  }
  const negativeTrace = circuit.db.source_trace.getWhere({ name: "USB_N" })
  if (!negativeTrace) {
    throw new Error("Expected the USB_N source trace")
  }
  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [
        positiveTrace.source_trace_id,
        negativeTrace.source_trace_id,
      ],
      lengthTolerance: 0.05,
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
