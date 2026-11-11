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
import type { Port } from "lib/components/primitive-components/Port/Port"
import { NativeA13DdrThermalPadBoard } from "tests/fixtures/a13-ddr-thermal-pad/board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const dataBits = [0, 1, 4, 7, 8, 9, 12, 13, 15]
const testName =
  "routes eighteen native A13 DDR paths past the exposed-pad thermal vias"

test(testName, async (): Promise<void> => {
  const { circuit } = getTestFixture()
  const asyncErrors: string[] = []
  const startedPhases: string[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncErrors.push(String(event.error))
  })
  circuit.on("autorouting:start", (event) => {
    startedPhases.push(event.phaseName!)
  })
  circuit.add(<NativeA13DdrThermalPadBoard dataBits={dataBits} />)
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    width: 1400,
    height: 1000,
    viewport: { minX: -14, maxX: 40, minY: -21, maxY: 22 },
    shouldDrawErrors: false,
    shouldDrawRatsNest: false,
    showPcbGroups: false,
  })

  expect(circuit.db.pcb_smtpad.list()).toHaveLength(369)
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(9)
  expect(circuit.db.source_trace.list()).toHaveLength(96)
  expect(circuit.db.source_ambiguous_port_reference.list()).toEqual([])
  const exposedPadPort = circuit.firstChild!.selectOne<Port>(".U100 > .pin177")!
  expect(exposedPadPort.pcb_port_id).toBeDefined()
  const exposedPad = circuit.db.pcb_smtpad.getWhere({
    pcb_port_id: exposedPadPort.pcb_port_id!,
  })!
  expect(exposedPad.shape).toBe("rotated_rect")
  if (exposedPad.shape !== "rotated_rect") {
    throw new Error("U100.GND_EP must retain its native rotated rectangle")
  }
  expect(exposedPad.width).toBe(6)
  expect(exposedPad.height).toBe(6)
  expect(exposedPad.ccw_rotation).toBe(315)
  for (const hole of circuit.db.pcb_plated_hole.list()) {
    expect(hole.pcb_port_id).toBe(exposedPadPort.pcb_port_id!)
    expect(hole).toMatchObject({
      shape: "circle",
      outer_diameter: 0.9,
      hole_diameter: 0.6,
    })
  }
  expect(circuit.db.pcb_pad_pad_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(asyncErrors).toEqual([])
  expect(startedPhases).toEqual(["DDR_DATA"])
  expect(circuit.db.pcb_trace.list()).toHaveLength(18)

  const json = circuit.getCircuitJson()
  const selectedDataNets = new Set(
    dataBits.flatMap((bit) => [`CPU_D${bit}`, `DRAM_D${bit}`]),
  )
  const dataChannel = json.filter(
    (element) =>
      element.type !== "source_trace" || selectedDataNets.has(element.name!),
  )
  expect(checkEachPcbPortConnectedToPcbTraces(dataChannel)).toEqual([])
  const physicalErrors = [
    ...checkEachPcbTraceNonOverlapping(json, { minClearance: 0.2 }),
    ...checkPadTraceClearance(json, { minClearance: 0.2 }),
    ...checkViaTraceClearance(json, { minClearance: 0.2 }),
    ...checkViaPadClearance(json, { minClearance: 0.2 }),
    ...checkTracesAreContiguous(json),
  ].filter((finding) => finding.type.endsWith("_error"))
  expect(physicalErrors).toEqual([])
  expect(checkViasInPads(json)).toEqual([])
})
