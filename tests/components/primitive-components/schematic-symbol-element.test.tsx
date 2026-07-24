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

  expect(circuit.db.pcb_component.list()).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: { cellSize: 0.5, labelCells: true },
  })
})
