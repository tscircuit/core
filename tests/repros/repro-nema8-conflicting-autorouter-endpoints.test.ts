import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"

const conflictingPcbTraceId =
  "source_trace_3__source_trace_4__source_trace_5__source_trace_6__source_trace_7__source_trace_8__source_trace_9__source_trace_10__source_trace_11_mst7_0"

test("the full NEMA8 board accepts a routed trace with endpoints on VM and GND", async () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL(
        "../fixtures/nema8-conflicting-autorouter-endpoints/circuit.json.gz",
        import.meta.url,
      ),
    ),
  )
  const circuitJson = JSON.parse(bytes.toString("utf8")) as AnyCircuitElement[]
  const db = su(circuitJson)
  const autoroutedPcbTrace = db.pcb_trace.get(conflictingPcbTraceId)!
  const endpointPcbPortIds = autoroutedPcbTrace.route
    .filter((point) => point.route_type === "wire")
    .flatMap((point) => [point.start_pcb_port_id, point.end_pcb_port_id])
  const endpointConnectivityKeys = endpointPcbPortIds
    .filter((pcbPortId): pcbPortId is string => Boolean(pcbPortId))
    .map((pcbPortId) => db.pcb_port.get(pcbPortId)!)
    .map((pcbPort) => db.source_port.get(pcbPort.source_port_id!)!)
    .map((sourcePort) => sourcePort.subcircuit_connectivity_map_key)

  expect(createHash("sha256").update(bytes).digest("hex")).toBe(
    "32f2eaaa2d3878ec108a9f8789e857d26a17b4bebeddd2d4aabfb1d923c373c1",
  )
  expect(circuitJson).toHaveLength(2469)
  expect(db.source_component.list()).toHaveLength(56)
  expect(db.source_trace.list()).toHaveLength(154)
  expect(endpointConnectivityKeys).toEqual([
    "CONTROLLER_PCB_connectivity_net2",
    "CONTROLLER_PCB_connectivity_net33",
  ])
  expect(
    getSourceTraceIdForRoutedTrace({
      db,
      trace: autoroutedPcbTrace,
      subcircuit_id: autoroutedPcbTrace.subcircuit_id,
    }),
  ).toBe("source_trace_8")

  const visualRepro = readFileSync(
    new URL(
      "../fixtures/nema8-conflicting-autorouter-endpoints/visual-repro.svg",
      import.meta.url,
    ),
    "utf8",
  )
    .replace("{{result_label}}", "Core routed-trace attribution")
    .replace("{{outcome}}", "ACCEPTED")
    .replace("{{expected}}", "Expected: REJECTED")
  await expect(visualRepro).toMatchSvgSnapshot(import.meta.path)
})
