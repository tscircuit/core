import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Board-world mm. The wire points on either side of the via repeat its
// position, which used to become 0x0 obstacles that failed autorouting.
const pcbtraceRouteWithVia = [
  { route_type: "wire", x: -6, y: -4, width: 0.15, layer: "top" },
  { route_type: "wire", x: -4, y: -4, width: 0.15, layer: "top" },
  { route_type: "via", x: -4, y: -4, from_layer: "top", to_layer: "bottom" },
  { route_type: "wire", x: -4, y: -4, width: 0.15, layer: "bottom" },
  { route_type: "wire", x: -2, y: -4, width: 0.15, layer: "bottom" },
] satisfies PcbTraceRoutePoint[]

test("a pcbtrace with a via does not stop the rest of the board from autorouting", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbtrace route={pcbtraceRouteWithVia} />
      <pcbnotetext
        pcbX={0}
        pcbY={4.5}
        fontSize={0.45}
        text="pcbtrace with a via (bottom left); R1-R2 must still autoroute"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(
    circuit.db.pcb_trace.list().filter((trace) => trace.source_trace_id),
  ).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
