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

  // This negative fixture cannot escape the inner RAM pads at 0.2mm without
  // drilling a pad. Repair leaves one trace-to-pad finding and up to three
  // via-to-pad findings. Restrict them to these escapes, with trace gaps above
  // 0.075mm and via gaps above 0.08mm; unrelated physical violations must fail.
  const knownTraceClearanceLimitations = [
    { component: "U200", pad: "BALL_E9", trace: "DRAM_D3" },
  ]
  const knownViaClearanceLimitations = [
    { component: "U200", pad: "BALL_E2", trace: "DRAM_D2" },
    { component: "U200", pad: "BALL_F3", trace: "DRAM_D2" },
    { component: "U200", pad: "BALL_E3", trace: "DRAM_D2" },
  ]
  const padClearanceErrors = checkPadTraceClearance(json, { minClearance: 0.2 })
  const viaPadClearanceErrors = checkViaPadClearance(json, {
    minClearance: 0.2,
  })
  expect(padClearanceErrors.length).toBeGreaterThan(0)
  expect(padClearanceErrors.length).toBeLessThanOrEqual(
    knownTraceClearanceLimitations.length,
  )
  expect(viaPadClearanceErrors.length).toBeLessThanOrEqual(
    knownViaClearanceLimitations.length,
  )
  for (const clearanceError of padClearanceErrors) {
    const pad = circuit.db.pcb_smtpad.get(clearanceError.pcb_pad_id)!
    const pcbPort = circuit.db.pcb_port.get(pad.pcb_port_id!)!
    const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id)!
    const sourceComponent = circuit.db.source_component.get(
      sourcePort.source_component_id!,
    )!
    const pcbTrace = circuit.db.pcb_trace.get(clearanceError.pcb_trace_id)!
    const sourceTrace = circuit.db.source_trace.get(pcbTrace.source_trace_id!)!
    expect(knownTraceClearanceLimitations).toContainEqual({
      component: sourceComponent.name,
      pad: sourcePort.name,
      trace: sourceTrace.name!,
    })
    expect(clearanceError.actual_clearance).toBeGreaterThan(0.075)
  }
  for (const clearanceError of viaPadClearanceErrors) {
    const [viaId, padId] = clearanceError.pcb_pad_ids!
    const via = circuit.db.pcb_via.get(viaId!)!
    const pad = circuit.db.pcb_smtpad.get(padId!)!
    const pcbPort = circuit.db.pcb_port.get(pad.pcb_port_id!)!
    const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id)!
    const sourceComponent = circuit.db.source_component.get(
      sourcePort.source_component_id!,
    )!
    const pcbTrace = circuit.db.pcb_trace.get(via.pcb_trace_id!)!
    const sourceTrace = circuit.db.source_trace.get(pcbTrace.source_trace_id!)!
    expect(knownViaClearanceLimitations).toContainEqual({
      component: sourceComponent.name,
      pad: sourcePort.name,
      trace: sourceTrace.name!,
    })
    expect(clearanceError.actual_clearance).toBeGreaterThan(0.08)
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
