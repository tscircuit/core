import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("no solder paste is emitted when solderPasteMargin shrinks the aperture to zero", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rect"
        width={2}
        height={1}
        solderPasteMargin={-0.6}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  expect(circuit.db.pcb_solder_paste.list().length).toBe(0)
  expect(circuit.db.pcb_smtpad.list().length).toBe(1)
})
