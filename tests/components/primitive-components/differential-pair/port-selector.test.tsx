import { expect, it } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("registers a differential pair using port selectors", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <differentialpair
        name="USB"
        positiveConnection="TP1"
        negativeConnection=".R2 > .pin1"
        maxLengthSkew={0.1}
      />
      <testpoint name="TP1" footprintVariant="pad" pcbX={-6} pcbY={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-4} pcbY={2} />
      <led name="LED1" footprint="0402" pcbX={6} pcbY={-2} />
      <led name="LED2" footprint="0402" pcbX={6} pcbY={2} />
      <trace name="USB_P" from="TP1" to=".LED1 > .anode" />
      <trace name="USB_N" from=".R2 > .pin1" to=".LED2 > .anode" />
      <pcbnotetext
        pcbX={0}
        pcbY={0}
        fontSize={0.8}
        text="Differential pair ports: TP1 / R2.pin1"
      />
    </board>,
  )

  circuit.render()

  const boardSubcircuit = circuit.firstChild
  if (!boardSubcircuit) {
    throw new Error("Expected the circuit to contain a board")
  }

  const positiveTrace = circuit.db.source_trace.getWhere({ name: "USB_P" })
  if (!positiveTrace) {
    throw new Error("Expected the USB_P source trace")
  }
  const negativeTrace = circuit.db.source_trace.getWhere({ name: "USB_N" })
  if (!negativeTrace) {
    throw new Error("Expected the USB_N source trace")
  }

  const circuitJsonWithoutPcbTraces: AnyCircuitElement[] = circuit
    .getCircuitJson()
    .filter((element): boolean => element.type !== "pcb_trace")
  const simpleRouteJson: SimpleRouteJson = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
    subcircuitComponent: boardSubcircuit,
  }).simpleRouteJson

  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [
        positiveTrace.source_trace_id,
        negativeTrace.source_trace_id,
      ],
      lengthTolerance: 0.1,
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
