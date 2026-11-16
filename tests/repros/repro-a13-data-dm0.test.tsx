import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { NativeDdrBoard } from "@tscircuit/core-ddr-benchmark/circuits/native-ddr-board"
import { arePortsConnected } from "@tscircuit/core-ddr-benchmark/scripts/connectivity"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaPadClearance,
  checkViaTraceClearance,
  checkViasInPads,
  checkTracesAreContiguous,
  checkHoleTraceClearance,
  checkDifferentNetViaSpacing,
} from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type NativeDdrSource = Parameters<typeof NativeDdrBoard>[0]["source"]

// Native board-world positions in mm: +X right, +Y up, +Z above.
// The 16 data bits retain both sides of their series resistors; DM0 does too.
test("native A13 data and DM0 reproduce the RAM escape collision", async (): Promise<void> => {
  const source = JSON.parse(
    gunzipSync(readFileSync(import.meta.resolve("@tscircuit/core-ddr-benchmark/circuits/a13.json.gz"))).toString(),
  ) as NativeDdrSource
  const requestedTraces = source.traces.filter((trace) =>
    trace.group !== "remaining" ||
    ["/DDR3 Memory/ddr-dm0", "/DDR3 Memory/dm0"].includes(trace.nativeNet),
  )
  const { circuit } = getTestFixture()
  circuit.add(<NativeDdrBoard source={{ ...source, requestedNames: requestedTraces.map((trace) => trace.name) }} />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcbPorts = new Map(circuitJson.filter((element) => element.type === "pcb_port").map((port) => [port.source_port_id, port]))
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  for (const requestedTrace of requestedTraces) {
    const sourceNet = circuit.db.source_net.list().find((net) => net.name === requestedTrace.name)!
    const sourceTraces = circuit.db.source_trace.list().filter((trace) => trace.connected_source_net_ids?.includes(sourceNet.source_net_id))
    const routeOwners = new Set([sourceNet.source_net_id, ...sourceTraces.map((trace) => trace.source_trace_id)])
    const routes = circuit.db.pcb_trace.list().filter((trace) => routeOwners.has(trace.source_trace_id!))
    const sourcePortIds = [...new Set(sourceTraces.flatMap((trace) => trace.connected_source_port_ids))]
    expect(sourcePortIds).toHaveLength(requestedTrace.path.length)
    expect(arePortsConnected(sourcePortIds, routes, pcbPorts, vias)).toBe(true)
  }
  expect(requestedTraces).toHaveLength(34)
  expect(circuit.db.source_net.list()).toHaveLength(96)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])

  const clearance = { minClearance: source.rules.appliedGlobalClearance }
  const physicalFindings = [
    ...checkEachPcbTraceNonOverlapping(circuitJson, clearance),
    ...checkPadTraceClearance(circuitJson, clearance),
    ...checkViaPadClearance(circuitJson, clearance),
    ...checkViaTraceClearance(circuitJson, clearance),
    ...checkViasInPads(circuitJson),
    ...checkTracesAreContiguous(circuitJson),
    ...checkHoleTraceClearance(circuitJson, clearance),
    ...checkDifferentNetViaSpacing(circuitJson),
  ].filter((finding) => finding.type.endsWith("_error"))
  expect(physicalFindings.length).toBeGreaterThan(0)
  console.log("A13_MASK_RESULT=" + JSON.stringify({ connectedPaths: requestedTraces.length, physicalFindings: physicalFindings.length }))

  const ram = circuit.db.source_component.list().find((chip) => chip.name === "U200")!
  const maskPort = circuit.db.source_port.list().find((port) => port.source_component_id === ram.source_component_id && port.name === "BALL_E7")!
  const maskPcbPort = circuit.db.pcb_port.list().find((port) => port.source_port_id === maskPort.source_port_id)!
  const snapshot: AnyCircuitElement[] = [
    ...circuitJson,
    { type: "pcb_note_text", pcb_note_text_id: "a13_mask_status", text: `34 paths; DRC: ${physicalFindings.length}`,
      anchor_position: { x: -4.1, y: 0.5 }, anchor_alignment: "center", font: "tscircuit2024", layer: "top", font_size: 0.13 },
    { type: "pcb_note_text", pcb_note_text_id: "a13_mask_label", text: "DM0 (E7)",
      anchor_position: { x: maskPcbPort.x, y: maskPcbPort.y + 0.25 }, anchor_alignment: "bottom_left", font: "tscircuit2024", layer: "top", font_size: 0.17 },
    { type: "pcb_note_text", pcb_note_text_id: "a13_board_status", text: `16 data bits and DM0: 34/34 paths connected; ${physicalFindings.length} physical findings`,
      anchor_position: { x: 12, y: 16.5 }, anchor_alignment: "center", font: "tscircuit2024", layer: "top", font_size: 0.5 },
  ]
  await expect(snapshot).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white", width: 1400, height: 1000,
    viewport: { minX: -10, maxX: 38, minY: -19, maxY: 18 },
    shouldDrawErrors: false, shouldDrawRatsNest: false, showErrorsInTextOverlay: false,
  })
  await expect(snapshot).toMatchPcbSnapshot(import.meta.path.replace(".test.tsx", "-ram.test.tsx"), {
    backgroundColor: "white", width: 1000, height: 750,
    viewport: { minX: -7.6, maxX: -0.6, minY: 0, maxY: 5.5 },
    shouldDrawErrors: false, shouldDrawRatsNest: false, showErrorsInTextOverlay: false,
  })
}, 900_000)
