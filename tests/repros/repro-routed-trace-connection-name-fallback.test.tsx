import { expect, test } from "bun:test"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("router connection names preserve explicit-source precedence and geometry fallback", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} routingDisabled schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbY={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbY={2} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const { db } = circuit
  const [firstSourceTrace, secondSourceTrace] = db.source_trace.list()
  // Native port points and route points are board-world millimeters:
  // +X right, +Y top, +Z above, right handed.
  const route = firstSourceTrace.connected_source_port_ids.map(
    (sourcePortId) => {
      const port = db.pcb_port
        .list()
        .find((port) => port.source_port_id === sourcePortId)!
      return {
        route_type: "wire" as const,
        x: port.x,
        y: port.y,
        width: 0.1,
        layer: "top",
      }
    },
  )
  const trace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "returned_route",
    connection_name: secondSourceTrace.source_trace_id,
    route,
  }
  expect(getSourceTraceIdForRoutedTrace({ db, trace })).toBe(
    secondSourceTrace.source_trace_id,
  )
  expect(
    getSourceTraceIdForRoutedTrace({
      db,
      trace: { ...trace, source_trace_id: firstSourceTrace.source_trace_id },
    }),
  ).toBe(firstSourceTrace.source_trace_id)
  expect(
    getSourceTraceIdForRoutedTrace({
      db,
      trace: { ...trace, connection_name: "router-local-label" },
    }),
  ).toBe(firstSourceTrace.source_trace_id)
})
