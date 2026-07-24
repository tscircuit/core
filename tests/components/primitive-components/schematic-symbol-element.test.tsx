import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol renders a standalone library symbol", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <schematicsymbol
        name="Q1"
        symbolName="n_channel_e_mosfet_transistor_horz"
        schX={1}
        schY={-1}
        schRotation={90}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicComponent = circuit.db.schematic_component.list()[0]

  expect(circuit.db.schematic_component.list()).toHaveLength(1)
  expect(schematicComponent).toMatchObject({
    center: { x: 1, y: -1 },
    symbol_name: "n_channel_e_mosfet_transistor_vert",
  })
  expect(schematicComponent?.source_component_id).toBeUndefined()
  expect(circuit.db.source_component.list()).toHaveLength(0)
  expect(circuit.db.source_port.list()).toHaveLength(3)
  expect(circuit.db.pcb_component.list()).toHaveLength(0)
  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(0)
  expect(
    circuit.db.source_port
      .list()
      .every((sourcePort) => sourcePort.source_component_id === undefined),
  ).toBe(true)
  expect(circuit.db.schematic_port.list()).toHaveLength(3)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: { cellSize: 0.5, labelCells: true },
  })
})
