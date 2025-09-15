import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import type { PcbRouteCache } from "@tscircuit/props"

test("trace caching between renders", async () => {
  const { circuit } = getTestFixture()

  const pcbRouteCache: PcbRouteCache = {
    cacheKey: "test",
    pcbTraces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "pcb_trace_0",
        route: [
          {
            route_type: "wire",
            x: -1.5,
            y: 0,
            width: 0.16,
            layer: "top",
            start_pcb_port_id: "pcb_port_1",
          },
          {
            route_type: "wire",
            x: 1.5,
            y: 0,
            width: 0.16,
            layer: "top",
            end_pcb_port_id: "pcb_port_2",
          },
        ],
        source_trace_id: "source_trace_0",
      },
    ],
  }

  circuit.add(
    <board width="10mm" height="10mm" pcbRouteCache={pcbRouteCache}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
