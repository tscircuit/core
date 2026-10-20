import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const diagonalPcbtraceRoute = [
  { route_type: "wire", x: -2, y: -4, width: 0.3, layer: "top" },
  { route_type: "wire", x: 2, y: 4, width: 0.3, layer: "top" },
] satisfies PcbTraceRoutePoint[]

test("a diagonal pcbtrace becomes a rotated autorouter obstacle instead of throwing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbtrace route={diagonalPcbtraceRoute} />
      <pcbnotetext
        pcbX={0}
        pcbY={5}
        fontSize={0.45}
        text="diagonal pcbtrace; R1-R2 must route around it"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace_missing_error.list()).toEqual([])
  expect(
    circuit.db.pcb_trace.list().filter((trace) => trace.source_trace_id),
  ).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
