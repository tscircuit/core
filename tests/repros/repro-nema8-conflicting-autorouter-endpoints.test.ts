import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbNoteText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"

const conflictingPcbTraceId =
  "source_trace_3__source_trace_4__source_trace_5__source_trace_6__source_trace_7__source_trace_8__source_trace_9__source_trace_10__source_trace_11_mst7_0"

test("the full NEMA8 board rejects a routed trace with endpoints on VM and GND", async () => {
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
  expect(() =>
    getSourceTraceIdForRoutedTrace({
      db,
      trace: autoroutedPcbTrace,
      subcircuit_id: autoroutedPcbTrace.subcircuit_id,
    }),
  ).toThrow(
    "Autorouted trace declares endpoints on different intended nets: C_VM_HF1.pin1, D_VM_TVS.pin2",
  )

  const note: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "nema8_conflicting_route_note",
    layer: "bottom",
    font: "tscircuit2024",
    font_size: 0.7,
    anchor_position: { x: 0.5, y: 5.2 },
    anchor_alignment: "center",
    color: "#ef4444",
    text: "BUG: VM route accepted at grounded TVS pad",
  }
  await expect(
    convertCircuitJsonToPcbSvg([...circuitJson, note], {
      layer: "bottom",
      width: 1200,
      height: 700,
      includeVersion: false,
      viewport: { minX: -4, maxX: 5, minY: 1, maxY: 6 },
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
