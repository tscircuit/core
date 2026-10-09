import { expect, test } from "bun:test"
import { getDefaultThroughHolePasteFixture } from "tests/fixtures/get-default-through-hole-paste-fixture"

test("ordinary round through-hole emits top and bottom paste without an opt-in", async () => {
  const circuit = getDefaultThroughHolePasteFixture()
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(1)
  const [smtpad] = circuit.db.pcb_smtpad.list()
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(1)
  const paste = circuit.db.pcb_solder_paste.list()
  expect(paste).toHaveLength(3)
  const throughHolePaste = paste.filter(
    (entry) => entry.shape === "circle" && entry.x === -4 && entry.y === 0,
  )
  expect(throughHolePaste.map((entry) => entry.layer).sort()).toEqual([
    "bottom",
    "top",
  ])
  const smtPaste = paste.filter(
    (entry) => entry.pcb_smtpad_id === smtpad.pcb_smtpad_id,
  )
  expect(smtPaste).toHaveLength(1)
  expect(smtPaste[0].layer).toBe("top")
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
