import { expect, test } from "bun:test"
import { getCanonicalSupplierOrientationBoard } from "tests/fixtures/canonical-supplier-orientation-board"

test("shows emitted pads and recovered pin-1 frames for both sides and all quarter turns", async () => {
  const circuit = await getCanonicalSupplierOrientationBoard()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
