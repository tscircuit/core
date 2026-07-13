import { expect, it } from "bun:test"
import type { DifferentialPair } from "lib"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("registers a differential pair routing constraint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.1}
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
        text="USB differential pair: USB_P / USB_N (10% max skew)"
      />
    </board>,
  )

  circuit.render()

  const differentialPair = circuit.selectOne(
    "differentialpair",
  ) as DifferentialPair
  expect(differentialPair._parsedProps).toEqual({
    name: "USB",
    positiveConnection: "USB_P",
    negativeConnection: "USB_N",
    maxLengthSkew: 0.1,
  })

  const circuitJsonWithoutPcbTraces = circuit
    .getCircuitJson()
    .filter((element) => element.type !== "pcb_trace")
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
    subcircuitComponent: circuit.firstChild!,
  })
  const positiveTrace = circuit.db.source_trace.getWhere({ name: "USB_P" })!
  const negativeTrace = circuit.db.source_trace.getWhere({ name: "USB_N" })!
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
