import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import type { PcbTrace } from "circuit-json"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"

test("portless routes resolve known connection names before neighboring copper", () => {
  const db = su([])
  const signal = db.source_trace.insert({
    connected_source_port_ids: [],
    connected_source_net_ids: [],
  })
  const ground = db.source_net.insert({
    name: "GND",
    member_source_group_ids: [],
  })
  // Board-world points in mm, +X right / +Y up, on the top copper layer.
  const trace = {
    type: "pcb_trace",
    pcb_trace_id: "bridge",
    route: [
      { route_type: "wire", x: 0, y: 0, layer: "top", width: 0.2 },
      { route_type: "wire", x: 2, y: 0, layer: "top", width: 0.2 },
    ],
  } satisfies PcbTrace

  // Both identifiers work before any other pieces have been inserted.
  for (const connection_name of [
    signal.source_trace_id,
    ground.source_net_id,
  ]) {
    expect(
      getSourceTraceIdForRoutedTrace({
        db,
        trace: { ...trace, connection_name },
      }),
    ).toBe(connection_name)
  }
  for (const connection_name of [undefined, "unknown_connection"]) {
    expect(
      getSourceTraceIdForRoutedTrace({
        db,
        trace: { ...trace, connection_name },
      }),
    ).toBeUndefined()
  }

  db.pcb_trace.insert({
    source_trace_id: ground.source_net_id,
    route: trace.route,
  })
  // A declared signal must not inherit GND merely because copper touches it.
  expect(
    getSourceTraceIdForRoutedTrace({
      db,
      trace: { ...trace, connection_name: signal.source_trace_id },
    }),
  ).toBe(signal.source_trace_id)
  // Preserve explicit ownership and the existing geometry fallback.
  expect(
    getSourceTraceIdForRoutedTrace({
      db,
      trace: {
        ...trace,
        source_trace_id: signal.source_trace_id,
        connection_name: ground.source_net_id,
      },
    }),
  ).toBe(signal.source_trace_id)
  expect(getSourceTraceIdForRoutedTrace({ db, trace })).toBe(
    ground.source_net_id,
  )
})
