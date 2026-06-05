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
      type: "schematic_line",
      schematic_symbol_id: "schematic_symbol_imported",
      x1: -1,
      y1: 0,
      x2: 1,
      y2: 0,
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
  expect(circuit.db.schematic_line.list()).toHaveLength(1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
