import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkTracesAreContiguous,
} from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  expectSharedNetRoutes,
  tracePcbPortIds,
} from "./full-mcu-routed-checks"
import { FullMcuRoutedFixture } from "./full-mcu-routed-fixture"

test("full C2913199 custom symbol and split ground pads with routed loads", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<FullMcuRoutedFixture />)
  await circuit.renderUntilSettled()
  const db = circuit.db
  expect(db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(db.pcb_port_not_connected_error.list()).toHaveLength(0)
  expect(db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(db.pcb_smtpad.list()).toHaveLength(53)
  expect(db.pcb_port.list()).toHaveLength(53)
  expect(db.schematic_port.list()).toHaveLength(45)
  expect(db.source_port.list()).toHaveLength(53)
  expect(db.pcb_trace.list()).toHaveLength(4)
  const components = db.source_component.list()
  const u1 = components.find((c) => c.name === "U1")!
  const sourcePorts = db.source_port.list()
  const pcbPorts = db.pcb_port.list()
  const pads = db.pcb_smtpad
    .list()
    .filter(
      (p) =>
        p.pcb_component_id ===
        db.pcb_component
          .list()
          .find((c) => c.source_component_id === u1.source_component_id)
          ?.pcb_component_id,
    )
  for (let pin = 1; pin <= 40; pin++) {
    const pad = pads.find((p) => p.port_hints?.includes(`pin${pin}`))!
    const pcbPort = pcbPorts.find((p) => p.pcb_port_id === pad.pcb_port_id)!
    const sourcePort = sourcePorts.find(
      (p) => p.source_port_id === pcbPort.source_port_id,
    )!
    expect(sourcePort.pin_number).toBe(pin)
  }
  const splitPads = pads.filter((p) => p.port_hints?.includes("pin41"))
  expect(splitPads).toHaveLength(9)
  const splitPcbIds = splitPads.map((pad) => pad.pcb_port_id!)
  expect(new Set(splitPcbIds).size).toBe(9)
  const splitSourceIds = splitPcbIds.map(
    (id) => pcbPorts.find((p) => p.pcb_port_id === id)!.source_port_id!,
  )
  expect(new Set(splitSourceIds).size).toBe(9)
  const groups = db.source_component_internal_connection.list()
  expect(groups).toHaveLength(1)
  expect(new Set(groups[0].source_port_ids)).toEqual(new Set(splitSourceIds))
  const { loadGround, traces } = expectSharedNetRoutes(circuit)
  expect(
    traces.some(
      (t) =>
        tracePcbPortIds(t).includes(loadGround) &&
        tracePcbPortIds(t).some((id) => splitPcbIds.includes(id)),
    ),
  ).toBe(true)
  const json = circuit.getCircuitJson()
  expect(checkTracesAreContiguous(json)).toEqual([])
  expect(checkEachPcbTraceNonOverlapping(json, { minClearance: 0.15 })).toEqual(
    [],
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPinNumbers: true,
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
    shouldDrawErrors: true,
    grid: { cellSize: 1, labelCells: true },
  })
})
