import { expect, test } from "bun:test"
import { pcb_solder_paste } from "circuit-json"
import { getPlatedHolePasteFixture } from "tests/fixtures/get-plated-hole-paste-fixture"

test("mixed through-hole and SMT board emits only valid SMT paste", () => {
  const circuit = getPlatedHolePasteFixture()
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(3)
  const solderPaste = circuit.db.pcb_solder_paste.list()
  expect(solderPaste).toHaveLength(1)
  pcb_solder_paste.parse(solderPaste[0])
  expect(solderPaste[0]).toMatchObject({
    pcb_smtpad_id: circuit.db.pcb_smtpad.list()[0].pcb_smtpad_id,
    layer: "top",
  })
})
