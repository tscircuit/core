import { expect, test } from "bun:test"
import { CopperTextGroupRotationBoard } from "tests/fixtures/copper-text-group-rotation-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reproduce copper labels ignoring group rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<CopperTextGroupRotationBoard />)
  await circuit.renderUntilSettled()

  // Observed output: red copper stays horizontal; yellow silkscreen rotates.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
