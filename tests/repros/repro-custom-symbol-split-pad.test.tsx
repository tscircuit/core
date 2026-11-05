import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectSharedNetRoutes } from "./full-mcu-routed-checks"
import { FullMcuRoutedFixture } from "./full-mcu-routed-fixture"

test("full C2913199 custom symbol and split ground pads with routed loads", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<FullMcuRoutedFixture />)
  await circuit.renderUntilSettled()
  const db = circuit.db
  expect(db.source_ambiguous_port_reference.list()).toHaveLength(1)
  expect(db.pcb_smtpad.list()).toHaveLength(53)
  expect(db.pcb_port.list()).toHaveLength(44)
  expect(db.schematic_port.list()).toHaveLength(45)
  expect(db.source_port.list()).toHaveLength(45)
  expect(db.pcb_trace.list()).toHaveLength(3)
  expect(db.pcb_port_not_connected_error.list()).toHaveLength(1)
  const { loadGround, traces } = expectSharedNetRoutes(circuit)
  expect(traces.some((t: any) => t.connectsTo.includes(loadGround))).toBe(false)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPinNumbers: true,
    showErrorsInTextOverlay: true,
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
    shouldDrawErrors: true,
    showErrorsInTextOverlay: true,
    grid: { cellSize: 1, labelCells: true },
  })
})
