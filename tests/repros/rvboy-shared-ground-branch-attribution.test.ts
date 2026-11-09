import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"

test("a merged RVboy ground branch is not attributed to an unrelated USB bridge", () => {
  const input = JSON.parse(
    gunzipSync(
      readFileSync(
        new URL(
          "../fixtures/rvboy-point-touching-pours.json.gz",
          import.meta.url,
        ),
      ),
    ).toString(),
  ) as AnyCircuitElement[]
  const db = su(input)
  const trace = db.pcb_trace
    .list()
    .find((trace) =>
      trace.pcb_trace_id.endsWith("source_net_0_mst173_0"),
    )! as PcbTrace & { connection_name: string }
  // Source attribution happens after routing, before this emitted field exists.
  const { source_trace_id: previousAttribution, ...routed } = trace
  expect(db.source_trace.get(previousAttribution!)!.display_name).toBe(
    ".C_SOC_54 > .pin2 to net.GND",
  )
  expect(
    getSourceTraceIdForRoutedTrace({
      db,
      trace: routed,
      subcircuit_id: trace.subcircuit_id,
    }),
  ).toBe(previousAttribution)
  expect(db.source_trace.get(trace.connection_name)!.name).toBe(
    "USB_GROUND_BRIDGE",
  )
  const fixedBypass = db.pcb_trace
    .list()
    .find((trace) => trace.pcb_trace_id === "bus_lane_source_trace_361")!
  expect(getSourceTraceIdForRoutedTrace({ db, trace: fixedBypass })).toBe(
    fixedBypass.source_trace_id,
  )
})
