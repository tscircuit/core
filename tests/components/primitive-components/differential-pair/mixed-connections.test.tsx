import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("registers a differential pair using a trace name and port selector", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection=".R2 > .pin1"
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
      <chip
        name="OUT"
        pcbX={6}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbY={-0.15}
              width={0.1}
              height={0.1}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbY={0.15}
              width={0.1}
              height={0.1}
              shape="rect"
            />
          </footprint>
        }
      />
      <trace name="USB_P" from=".R1 > .pin1" to=".OUT > .pin1" />
      <trace name="USB_N" from=".R2 > .pin1" to=".OUT > .pin2" />
      <pcbnotetext
        pcbX={0}
        pcbY={0}
        fontSize={0.8}
        text="Mixed pair selectors: USB_P / R2.pin1"
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

  const circuitJsonWithoutPcbTraces = circuit
    .getCircuitJson()
    .filter((element) => element.type !== "pcb_trace")
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
    subcircuitComponent: boardSubcircuit,
  })

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
