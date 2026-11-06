import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import type { PcbTrace } from "circuit-json"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"

test("portless ownership follows same-layer copper and rejects conflicting nets", () => {
  const db = su([])
  const signal = db.source_trace.insert({
    connected_source_port_ids: [],
    connected_source_net_ids: [],
  })
  const otherSignal = db.source_trace.insert({
    connected_source_port_ids: [],
    connected_source_net_ids: [],
  })
  // Board-world points in mm, +X right / +Y up. The via leaves only one
  // wire point on top; there is no top-layer segment in the first piece.
  db.pcb_trace.insert({
    source_trace_id: signal.source_trace_id,
    route: [
      { route_type: "wire", x: 0, y: 0, layer: "bottom", width: 0.2 },
      { route_type: "wire", x: 0, y: 1, layer: "bottom", width: 0.2 },
      { route_type: "via", x: 0, y: 1, from_layer: "bottom", to_layer: "top" },
      { route_type: "wire", x: 0, y: 1, layer: "top", width: 0.2 },
    ],
  })
  const trace = {
    type: "pcb_trace",
    pcb_trace_id: "bridge",
    route: [
      { route_type: "wire", x: 0, y: 1, layer: "top", width: 0.2 },
      { route_type: "wire", x: 2, y: 1, layer: "top", width: 0.2 },
    ],
  } satisfies PcbTrace
  expect(getSourceTraceIdForRoutedTrace({ db, trace })).toBe(
    signal.source_trace_id,
  )

  // A matching name cannot connect copper on another layer or across a gap.
  for (const route of [
    trace.route.map((point) => ({ ...point, layer: "inner1" })),
    trace.route.map((point) => ({ ...point, y: point.y + 0.1 })),
  ]) {
    expect(
      getSourceTraceIdForRoutedTrace({
        db,
        trace: { ...trace, route, connection_name: signal.source_trace_id },
      }),
    ).toBeUndefined()
  }

  db.pcb_trace.insert({
    source_trace_id: otherSignal.source_trace_id,
    route: [
      { route_type: "wire", x: 2, y: 1, layer: "top", width: 0.2 },
      { route_type: "wire", x: 2, y: 2, layer: "top", width: 0.2 },
    ],
  })
  expect(getSourceTraceIdForRoutedTrace({ db, trace })).toBeUndefined()

  // Different source traces may legitimately belong to the same logical net.
  const net = db.source_net.insert({
    name: "SIGNAL",
    member_source_group_ids: [],
  })
  for (const sourceTrace of [signal, otherSignal]) {
    db.source_trace.update(sourceTrace.source_trace_id, {
      connected_source_net_ids: [net.source_net_id],
    })
  }
  expect(getSourceTraceIdForRoutedTrace({ db, trace })).toBe(
    signal.source_trace_id,
  )
})
