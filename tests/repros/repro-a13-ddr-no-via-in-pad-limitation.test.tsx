import { expect, test } from "bun:test"
import {
  checkEachPcbPortConnectedToPcbTraces,
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkTracesAreContiguous,
  checkViaPadClearance,
  checkViaTraceClearance,
  checkViasInPads,
} from "@tscircuit/checks"
import { NativeA13DdrThermalPadBoard } from "tests/fixtures/a13-ddr-thermal-pad/board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("A13 D0-D3 forbids drilled pads while retaining its clearance limitation", async (): Promise<void> => {
  const { circuit } = getTestFixture()
  circuit.add(
    <NativeA13DdrThermalPadBoard routingNote="No via-in-pad; D0-D3 clearance violations remain" />,
  )
  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  expect(circuit.db.pcb_trace.list()).toHaveLength(8)
  expect(circuit.db.source_trace.list()).toHaveLength(96)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const dataChannel = json.filter(
    (element) =>
      element.type !== "source_trace" ||
      /^(CPU|DRAM)_D[0-3]$/.test(element.name!),
  )
  expect(checkEachPcbPortConnectedToPcbTraces(dataChannel)).toEqual([])
  expect(checkViasInPads(json)).toEqual([])

  // With these native dimensions, the inner RAM pads cannot escape without
  // violating clearance or drilling a pad. Preserve that limit explicitly.
  const padClearanceErrors = [
    ...checkPadTraceClearance(json, { minClearance: 0.2 }),
    ...checkViaPadClearance(json, { minClearance: 0.2 }),
  ]
  expect(padClearanceErrors.length).toBeGreaterThan(0)
  expect(padClearanceErrors.length).toBeLessThanOrEqual(3)
  for (const clearanceError of padClearanceErrors) {
    expect(clearanceError.actual_clearance).toBeGreaterThan(0)
  }
  const otherPhysicalErrors = [
    ...checkEachPcbTraceNonOverlapping(json, { minClearance: 0.2 }),
    ...checkViaTraceClearance(json, { minClearance: 0.2 }),
    ...checkTracesAreContiguous(json),
  ].filter((finding) => finding.type.endsWith("_error"))
  expect(otherPhysicalErrors).toEqual([])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    width: 1400,
    height: 1000,
    viewport: { minX: -14, maxX: 40, minY: -21, maxY: 22 },
    shouldDrawErrors: false,
    shouldDrawRatsNest: false,
    showPcbGroups: false,
  })
})
