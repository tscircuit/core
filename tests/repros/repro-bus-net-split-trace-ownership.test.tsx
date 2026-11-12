import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("split bus branches resolve the sole source trace on their named net", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={12} schematicDisabled routingDisabled>
      <net name="DQ0" />
      {[
        { name: "CPU", pcbX: -4, pcbY: 0 },
        { name: "RAM", pcbX: 4, pcbY: 0 },
        { name: "TP", pcbX: 0, pcbY: 3 },
      ].map(({ name, pcbX, pcbY }) => (
        <chip
          key={name}
          name={name}
          pcbX={pcbX}
          pcbY={pcbY}
          footprint={
            <footprint>
              <smtpad portHints={["pin1"]} shape="circle" radius={0.3} />
            </footprint>
          }
        />
      ))}
      <trace
        name="DATA0"
        path={["CPU.pin1", "RAM.pin1", "TP.pin1", "net.DQ0"]}
      />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.5}
        text="DQ0: main route and branch share DATA0"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sourceNet = circuit.db.source_net.list()[0]!
  const sourceTrace = circuit.db.source_trace.list()[0]!
  const routedTraces: PcbTrace[] = [
    {
      type: "pcb_trace",
      pcb_trace_id: "dq0_main",
      source_trace_id: sourceNet.source_net_id,
      route: [
        { route_type: "wire", x: -4, y: 0, width: 0.15, layer: "top" },
        { route_type: "wire", x: 4, y: 0, width: 0.15, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "dq0_branch",
      source_trace_id: sourceNet.source_net_id,
      route: [
        { route_type: "wire", x: 0, y: 3, width: 0.15, layer: "top" },
        { route_type: "wire", x: 0, y: 0, width: 0.15, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "dq0_internal_via",
      source_trace_id: sourceNet.source_net_id,
      route: [
        {
          route_type: "via",
          x: 0,
          y: 0,
          from_layer: "top",
          to_layer: "bottom",
        },
      ],
    },
  ]
  for (const routedTrace of routedTraces) {
    const sourceTraceId = getSourceTraceIdForRoutedTrace({
      db: circuit.db,
      trace: routedTrace,
    })
    expect(sourceTraceId).toBe(sourceTrace.source_trace_id)
    circuit.db.pcb_trace.insert({
      ...routedTrace,
      source_trace_id: sourceTraceId,
    })
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
