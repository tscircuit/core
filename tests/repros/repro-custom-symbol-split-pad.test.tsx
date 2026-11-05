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
  const groundSourcePort = sourcePorts.find(
    (port) =>
      port.source_component_id === u1.source_component_id &&
      port.pin_number === 41,
  )!
  const groundSchematicPort = db.schematic_port
    .list()
    .find((port) => port.source_port_id === groundSourcePort.source_port_id)!
  const groundSourceTrace = db.source_trace
    .list()
    .find((trace) =>
      trace.connected_source_port_ids.includes(groundSourcePort.source_port_id),
    )
  expect(groundSourceTrace).toBeDefined()
  expect(groundSourceTrace!.connected_source_port_ids).toEqual([
    groundSourcePort.source_port_id,
  ])
  expect(groundSourceTrace!.display_name).toBe(".U1 > .pin41 to net.GND")
  expect(groundSchematicPort.is_connected).toBe(true)
  const groundSchematicTrace = db.schematic_trace
    .list()
    .find(
      (trace) =>
        trace.subcircuit_connectivity_map_key ===
          groundSourceTrace!.subcircuit_connectivity_map_key &&
        trace.edges.some((edge) =>
          [edge.from, edge.to].some(
            (point) =>
              Math.hypot(
                point.x - groundSchematicPort.center.x,
                point.y - groundSchematicPort.center.y,
              ) < 1e-6,
          ),
        ),
    )
  expect(groundSchematicTrace).toBeDefined()
  expect(
    db.schematic_net_label
      .list()
      .some(
        (label) =>
          label.text === "GND" &&
          groundSourceTrace!.connected_source_net_ids.includes(
            label.source_net_id!,
          ) &&
          groundSchematicTrace!.edges.some((edge) =>
            [edge.from, edge.to].some(
              (point) =>
                Math.hypot(
                  point.x - label.anchor_position!.x,
                  point.y - label.anchor_position!.y,
                ) < 1e-6,
            ),
          ),
      ),
  ).toBe(true)
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
    showErrorsInTextOverlay: true,
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showErrorsInTextOverlay: true,
    grid: { cellSize: 1, labelCells: true },
  })
})
