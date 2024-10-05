import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("create solderpaste from smtpad", async () => {
  const { circuit, logSoup } = getTestFixture()
  const smtPadWidth = 10
  const smtPadHeight = 10
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        height={smtPadHeight}
        width={smtPadWidth}
        shape="rect"
        layer={"top"}
        pcbX={0}
        pcbY={0}
        portHints={[]}
      />
    </board>,
  )

  circuit.render()

  const [solder_paste] = circuit.db.pcb_solder_paste.list()
  const [smtpad] = circuit.db.pcb_smtpad.list()

  expect(solder_paste.shape).toBe("rect")
  if (solder_paste.shape === "rect")
    expect(solder_paste.height).toBe(smtPadHeight * 0.7)
  expect(smtpad.pcb_smtpad_id).toBe(solder_paste.pcb_smtpad_id!)
})
