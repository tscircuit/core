import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { PdSheet } from "./pd-sheet"

test("PD sheet with explicitly placed GND labels", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(<PdSheet />)

  await circuit.renderUntilSettled()

  // Reproduces the dangling EP trace below U_PD's explicit GND symbol.
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})
