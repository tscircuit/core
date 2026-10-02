import { expect, test } from "bun:test"
import { getPlatedHolePasteFixture } from "tests/fixtures/get-plated-hole-paste-fixture"

test("renders paste on vertical and rotated through-hole slots", async () => {
  const circuit = getPlatedHolePasteFixture()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
