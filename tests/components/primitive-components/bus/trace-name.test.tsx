import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("registers a bus routing constraint from trace names", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm">
      <bus name="DATA" connections={["D0", "D1", "D2", "D3"]} />
      <chip name="U1" footprint="soic8" pcbX={-7} />
      <chip name="U2" footprint="soic8" pcbX={7} />
      <trace name="D0" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="D1" from=".U1 > .pin2" to=".U2 > .pin2" />
      <trace name="D2" from=".U1 > .pin3" to=".U2 > .pin3" />
      <trace name="D3" from=".U1 > .pin4" to=".U2 > .pin4" />
      <pcbnotetext
        pcbX={0}
        pcbY={-5}
        fontSize={0.8}
        text="DATA bus: D0, D1, D2, D3"
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
  const sourceTraceIds = ["D0", "D1", "D2", "D3"].map((name) => {
    const sourceTrace = circuit.db.source_trace.getWhere({ name })
    if (!sourceTrace) throw new Error(`Expected the ${name} source trace`)
    return sourceTrace.source_trace_id
  })

  expect(simpleRouteJson.buses).toEqual([
    {
      name: "DATA",
      connectionNames: sourceTraceIds,
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
