import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import H616CompleteBoard from "./fixtures/h616-complete-board"

test("routes the complete H616 board with its DDR timing constraints", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<H616CompleteBoard />)
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 7_200_000)
