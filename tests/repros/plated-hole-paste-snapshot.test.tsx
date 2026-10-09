import { expect, test } from "bun:test"
import { getPlatedHolePasteFixture } from "tests/fixtures/get-plated-hole-paste-fixture"

test("renders through-hole copper with paste only on the SMT pad", async () => {
  const circuit = getPlatedHolePasteFixture()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
