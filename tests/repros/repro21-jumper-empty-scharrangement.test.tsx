import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

// Reproduction for bug where empty schPortArrangement caused symmetric schematic pins

test("Jumper defaults to single-sided schematic layout when schPortArrangement is empty", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper name="J1" footprint="pinrow4" />
    </board>,
  )

  circuit.render()
  await circuit.renderUntilSettled()

  const portSides = new Set(
    circuit.db.schematic_port.list().map((p) => p.side_of_component),
  )
  expect(portSides.size).toBe(1)
})
