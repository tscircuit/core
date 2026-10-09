import { expect, test } from "bun:test"
import { getDefaultThroughHolePasteFixture } from "tests/fixtures/get-default-through-hole-paste-fixture"

test.failing(
  "ordinary through-hole should not add stencil paste by default",
  () => {
    const circuit = getDefaultThroughHolePasteFixture()
    // The companion output test checks successful rendering and the SMT control.
    // This proposed default leaves only the explicitly modelled SMT pad's paste.
    const smtpadId = circuit.db.pcb_smtpad.list()[0].pcb_smtpad_id
    expect(
      circuit.db.pcb_solder_paste.list().map((paste) => paste.pcb_smtpad_id),
    ).toEqual([smtpadId])
  },
)
