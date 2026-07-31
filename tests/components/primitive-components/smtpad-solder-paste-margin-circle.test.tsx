import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("circle pads apply solderPasteMargin to the radius once per side", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="circle"
        radius={0.5}
        solderPasteMargin={-0.1}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  const [solder_paste] = circuit.db.pcb_solder_paste.list()
  expect(solder_paste.shape).toBe("circle")
  if (solder_paste.shape === "circle") {
    expect(solder_paste.radius).toBeCloseTo(0.4)
  }
})
