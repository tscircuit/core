import { expect, test } from "bun:test"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routed trace attribution rejects a source trace that conflicts with explicit PCB endpoints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        pcbX={-4}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              layer="top"
              portHints={["pin1"]}
              pcbX={-1}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              layer="top"
              portHints={["pin2"]}
              pcbX={1}
            />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={4}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              layer="top"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <trace from=".U1 > .pin1" to="net.GND" />
      <trace from=".U2 > .pin1" to="net.GND" />
      <trace from=".U1 > .pin2" to="net.VBAT" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const db = circuit.db
  const gndNet = db.source_net.list().find((net) => net.name === "GND")!
  const vbatNet = db.source_net.list().find((net) => net.name === "VBAT")!
  const gndSourceTraces = db.source_trace
    .list()
    .filter((trace) =>
      trace.connected_source_net_ids.includes(gndNet.source_net_id),
    )
  const gndSourceTraceIds = new Set(
    gndSourceTraces.map((trace) => trace.source_trace_id),
  )
  const gndSourcePortIds = new Set(
    gndSourceTraces.flatMap((trace) => trace.connected_source_port_ids),
  )
  const vbatSourceTrace = db.source_trace
    .list()
    .find((trace) =>
      trace.connected_source_net_ids.includes(vbatNet.source_net_id),
    )!

  const gndPcbPorts = db.pcb_port
    .list()
    .filter(
      (pcbPort) =>
        pcbPort.source_port_id && gndSourcePortIds.has(pcbPort.source_port_id),
    )
  expect(gndPcbPorts).toHaveLength(2)

  const attributedSourceTraceId = getSourceTraceIdForRoutedTrace({
    db,
    trace: {
      type: "pcb_trace",
      pcb_trace_id: "synthetic_gnd_trace",
      source_trace_id: vbatSourceTrace.source_trace_id,
      route: [
        {
          route_type: "wire",
          x: gndPcbPorts[0].x,
          y: gndPcbPorts[0].y,
          width: 0.15,
          layer: "top",
          start_pcb_port_id: gndPcbPorts[0].pcb_port_id,
        },
        {
          route_type: "wire",
          x: gndPcbPorts[1].x,
          y: gndPcbPorts[1].y,
          width: 0.15,
          layer: "top",
          end_pcb_port_id: gndPcbPorts[1].pcb_port_id,
        },
      ],
    },
  })

  expect(attributedSourceTraceId).not.toBe(vbatSourceTrace.source_trace_id)
  expect(gndSourceTraceIds.has(attributedSourceTraceId!)).toBe(true)
})
