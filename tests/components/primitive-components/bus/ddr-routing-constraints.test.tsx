import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("emits resolved DDR bus and differential-pair constraints", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm" routingDisabled>
      <bus
        name="DDR_BYTE_LANE_0"
        connections={["DQ0", "DQS_P", "DQS_N", "DQ1"]}
        maxLengthSkew="250um"
        targetImpedance="50ohm"
        pcbTraceWidth="120um"
        pcbAllowedLayers={["top", "inner1"]}
      />
      <differentialpair
        name="DQS0"
        positiveConnection="DQS_P"
        negativeConnection="DQS_N"
        maxLengthSkew="100um"
        targetDifferentialImpedance="100ohm"
        pcbTraceGap="100um"
        maxUncoupledLength="500um"
      />
      <chip name="U1" footprint="soic8" pcbX={-7} />
      <chip name="U2" footprint="soic8" pcbX={7} />
      <trace name="DQ0" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="DQS_P" from=".U1 > .pin2" to=".U2 > .pin2" />
      <trace name="DQS_N" from=".U1 > .pin3" to=".U2 > .pin3" />
      <trace name="DQ1" from=".U1 > .pin4" to=".U2 > .pin4" />
      <pcbnotetext
        pcbX={0}
        pcbY={-5}
        fontSize={0.65}
        text="Resolved DDR SRJ: 0.12mm width, 0.10mm DQS gap, top/inner1"
      />
    </board>,
  )

  circuit.render()

  const boardSubcircuit = circuit.firstChild
  if (!boardSubcircuit) {
    throw new Error("Expected the circuit to contain a board")
  }
  const circuitJsonWithoutPcbTraces = circuit
    .getCircuitJson()
    .filter((element) => element.type !== "pcb_trace")
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
    subcircuitComponent: boardSubcircuit,
  })
  const sourceTraceIds = ["DQ0", "DQS_P", "DQS_N", "DQ1"].map((name) => {
    const sourceTrace = circuit.db.source_trace.getWhere({ name })
    if (!sourceTrace) throw new Error(`Expected the ${name} source trace`)
    return sourceTrace.source_trace_id
  })

  expect(simpleRouteJson.buses).toEqual([
    {
      busId: "DDR_BYTE_LANE_0",
      name: "DDR_BYTE_LANE_0",
      connectionNames: sourceTraceIds,
      maxLengthSkew: 0.25,
      traceWidth: 0.12,
      allowedLayers: ["top", "inner1"],
    },
  ])
  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [sourceTraceIds[1], sourceTraceIds[2]],
      lengthTolerance: 0.1,
      traceGap: 0.1,
      maxUncoupledLength: 0.5,
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
