import { expect, test } from "bun:test"
import { pcb_solder_paste } from "circuit-json"
import { getPlatedHolePasteFixture } from "tests/fixtures/get-plated-hole-paste-fixture"

test("through-hole pill paste validates and follows pad rotation", () => {
  const circuit = getPlatedHolePasteFixture()
  const solderPaste = circuit.db.pcb_solder_paste.list()
  expect(solderPaste).toHaveLength(7)
  for (const paste of solderPaste) {
    pcb_solder_paste.parse(paste)
  }
  const slotPaste = solderPaste.filter((paste) => paste.x !== 0)
  expect(slotPaste).toHaveLength(4)
  for (const paste of slotPaste) {
    if (paste.shape !== "rotated_pill") {
      throw new Error("Expected paste with an explicit slot rotation")
    }
    expect(paste.radius).toBeCloseTo(0.762, 6)
    expect(paste.ccw_rotation).toBe(paste.x < 0 ? 0 : 90)
  }
})
