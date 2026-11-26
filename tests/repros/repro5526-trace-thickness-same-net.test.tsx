import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("thickness on one <trace> does not widen other autorouted traces on the same net or hijack their source_trace attribution", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-10}
        pcbY={5}
      />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={10} pcbY={5} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0603"
        pcbX={-10}
        pcbY={-5}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0603"
        pcbX={10}
        pcbY={-5}
      />
      {/* only this trace asks for 0.8mm */}
      <trace from="R1.pin2" to="R2.pin1" thickness="0.8mm" />
      {/* same net, no thickness */}
      <trace from="R3.pin2" to="net.VBUS" />
      <trace from="R4.pin1" to="net.VBUS" />
      <trace from="R1.pin2" to="net.VBUS" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.toArray().filter((elm) => "error_type" in elm)
  expect(errors).toEqual([])

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThanOrEqual(3)

  const traceSummaries = pcbTraces.map((pcbTrace) => {
    const wireWidths = pcbTrace.route
      .filter((pt) => pt.route_type === "wire")
      .map((pt) => pt.width)
    const maxWidth = Math.max(...wireWidths)
    const sourceTrace = pcbTrace.source_trace_id
      ? circuit.db.source_trace.get(pcbTrace.source_trace_id)
      : undefined
    return {
      maxWidth,
      displayName: sourceTrace?.display_name,
    }
  })

  const thickTraces = traceSummaries.filter((t) => t.maxWidth > 0.4)
  const defaultWidthTraces = traceSummaries.filter((t) => t.maxWidth <= 0.2)

  expect(thickTraces).toHaveLength(1)
  expect(thickTraces[0]?.maxWidth).toBeCloseTo(0.8, 3)
  expect(thickTraces[0]?.displayName).toContain("R1")
  expect(thickTraces[0]?.displayName).toContain("R2")

  expect(defaultWidthTraces.length).toBeGreaterThanOrEqual(2)
  for (const branch of defaultWidthTraces) {
    expect(branch.maxWidth).toBeCloseTo(0.15, 3)
    expect(branch.displayName).not.toBe(thickTraces[0]?.displayName)
  }
  expect(defaultWidthTraces.some((t) => t.displayName?.includes("R3"))).toBe(
    true,
  )
  expect(defaultWidthTraces.some((t) => t.displayName?.includes("R4"))).toBe(
    true,
  )

  // Also verify SimpleRouteJson retains separate widths for direct trace vs net
  const circuitJsonWithoutPcbTraces = circuit
    .getCircuitJson()
    .filter((elm) => elm.type !== "pcb_trace" && elm.type !== "pcb_via")
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
  })
  const directConn = simpleRouteJson.connections.find(
    (c) => c.source_trace_id !== undefined,
  )
  const netConn = simpleRouteJson.connections.find(
    (c) => c.source_trace_id === undefined,
  )
  expect(directConn?.nominalTraceWidth).toBe(0.8)
  expect(netConn?.nominalTraceWidth).toBeLessThan(0.8)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
