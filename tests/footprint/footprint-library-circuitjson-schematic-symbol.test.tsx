import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint circuitjson rehydrates schematic symbol", async () => {
  const footprintWithSchematicSymbol = [
    {
      type: "pcb_smtpad",
      shape: "rect",
      x: -0.6,
      y: 0,
      width: 0.5,
      height: 0.7,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      shape: "rect",
      x: 0.6,
      y: 0,
      width: 0.5,
      height: 0.7,
      layer: "top",
    },
    {
      type: "schematic_symbol",
      schematic_symbol_id: "schematic_symbol_imported",
      name: "imported_test_symbol",
    },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_imported",
      source_component_id: "source_component_imported",
      schematic_symbol_id: "schematic_symbol_imported",
      center: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      is_box_with_pins: true,
    },
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_imported",
      schematic_component_id: "schematic_component_imported",
      source_port_id: "source_port_imported",
      center: { x: -1, y: 0 },
      facing_direction: "left",
      side_of_component: "left",
      distance_from_component_edge: 0.4,
      pin_number: 1,
      is_connected: false,
    },
    {
      type: "schematic_rect",
      schematic_symbol_id: "schematic_symbol_imported",
      center: { x: 0, y: 0 },
      width: 2,
      height: 0.7,
      stroke_width: 0.08,
      color: "rgba(132, 0, 0)",
      is_dashed: false,
    },
  ] as const

  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        testlib: async () => ({
          footprintCircuitJson: footprintWithSchematicSymbol as any,
        }),
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="testlib:imported-symbol" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(circuit.db.schematic_symbol.list()).toHaveLength(1)
  expect(circuit.db.schematic_rect.list()).toHaveLength(1)
  expect(circuit.db.schematic_line.list()).toMatchObject([
    {
      x1: -1,
      y1: 0,
      x2: -1.4,
      y2: 0,
    },
  ])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
