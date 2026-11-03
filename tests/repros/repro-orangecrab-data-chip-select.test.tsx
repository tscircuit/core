import { expect, test } from "bun:test"
import {
  checkDifferentNetViaSpacing,
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkTracesAreContiguous,
  checkViaPadClearance,
  checkViaTraceClearance,
  checkViasInPads,
} from "@tscircuit/checks"
import { PcbConnectivityMap } from "circuit-json-to-connectivity-map"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import {
  OrangeCrabDataChipSelectBoard,
  orangeCrabDataChipSelectConnections,
} from "tests/fixtures/orangecrab-data-chip-select/board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { orangeCrabClockSnapshotOptions } from "tests/fixtures/orangecrab-ddr-clock/render"

async function verifyOrangeCrabDataChipSelectRouting(): Promise<void> {
  const { circuit } = getTestFixture()
  const phaseNames: Array<string | undefined> = []
  const completedDataTraces: SimplifiedPcbTrace[] = []
  const asyncErrors: string[] = []
  circuit.on("autorouting:start", (event) => {
    phaseNames.push(event.phaseName)
  })
  circuit.on("autorouting:end", (event) => {
    if (event.phaseName === "DATA_BYTE1") {
      completedDataTraces.push(...event.simpleRouteJson.traces!)
    }
  })
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncErrors.push(String(event.error))
  })
  circuit.add(<OrangeCrabDataChipSelectBoard />)
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path,
    orangeCrabClockSnapshotOptions,
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(17)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(387)
  expect(circuit.db.source_trace.list()).toHaveLength(51)
  expect(phaseNames).toEqual(["DATA_BYTE0", "DATA_BYTE1", "CHIP_SELECT"])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(asyncErrors).toEqual([])
  expect(completedDataTraces).toHaveLength(16)
  for (const trace of completedDataTraces) {
    expect(circuit.db.pcb_trace.get(trace.pcb_trace_id)?.route).toMatchObject(
      trace.route.map((point) => {
        if (point.route_type !== "via") return point
        const { layers: _layers, ...viaPoint } = point
        return viaPoint
      }),
    )
    for (const point of trace.route) {
      if (point.route_type !== "via") continue
      expect(circuit.db.pcb_via.list()).toContainEqual(
        expect.objectContaining({
          x: point.x,
          y: point.y,
          outer_diameter: point.via_diameter,
          hole_diameter: point.via_hole_diameter,
          layers: point.layers,
        }),
      )
    }
  }

  const json = circuit.getCircuitJson()
  const pcbConnectivity = new PcbConnectivityMap(json)
  const pcbPortsBySourcePort = new Map(
    circuit.db.pcb_port
      .list()
      .map((port) => [port.source_port_id, port.pcb_port_id]),
  )
  const selectedNames = new Set(orangeCrabDataChipSelectConnections)
  const selectedTraces = circuit.db.source_trace
    .list()
    .filter((trace) => selectedNames.has(trace.name!))
  expect(selectedTraces).toHaveLength(17)
  for (const trace of selectedTraces) {
    const pcbPortIds = trace.connected_source_port_ids.map(
      (sourcePortId) => pcbPortsBySourcePort.get(sourcePortId)!,
    )
    expect(pcbConnectivity.connMap.areAllIdsConnected(pcbPortIds)).toBe(true)
  }
  const physicalErrors = [
    ...checkEachPcbTraceNonOverlapping(json, { minClearance: 0.089 }),
    ...checkPadTraceClearance(json, { minClearance: 0.089 }),
    ...checkViaTraceClearance(json, { minClearance: 0.089 }),
    ...checkViaPadClearance(json, { minClearance: 0.089 }),
    ...checkDifferentNetViaSpacing(json),
    ...checkViasInPads(json),
    ...checkTracesAreContiguous(json),
  ].filter((finding) => finding.type.endsWith("_error"))
  expect(physicalErrors).toEqual([])
}

test.failing(
  "routes native OrangeCrab chip-select after both data bytes without changing completed copper",
  verifyOrangeCrabDataChipSelectRouting,
  60_000,
)
