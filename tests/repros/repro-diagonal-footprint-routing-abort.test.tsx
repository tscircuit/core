import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local mm: +X right, +Y up, right-handed.
const diagonalCopper = [
  { route_type: "wire", x: -2, y: -2, width: 0.2, layer: "top" },
  { route_type: "wire", x: 2, y: 0, width: 0.2, layer: "top" },
] satisfies PcbTraceRoutePoint[]

test("diagonal footprint copper aborts external autorouting", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={12} autorouter="auto_local">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={3} />
      <resistor
        name="R3"
        resistance="0"
        doNotPlace
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-2}
              pcbY={-2}
              width={0.6}
              height={0.6}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={2}
              pcbY={0}
              width={0.6}
              height={0.6}
              shape="rect"
            />
            <pcbtrace route={diagonalCopper} />
          </footprint>
        }
      />
      <trace from="R1.pin2" to="R2.pin1" />
      <pcbnotetext
        text="BUG: diagonal R3 copper aborts autorouting"
        pcbY={5}
        fontSize={0.45}
      />
      <pcbnotetext
        text="R1-R2 remains unrouted despite a clear path"
        pcbY={-4.5}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace_missing_error.list()).toHaveLength(1)
  expect(
    circuit.db.pcb_trace.list().filter((trace) => trace.source_trace_id),
  ).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
