import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a zero solderPasteMargin yields a 1:1 aperture", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rect"
        width={2}
        height={1}
        solderPasteMargin={0}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  const [solder_paste] = circuit.db.pcb_solder_paste.list()
  expect(solder_paste.shape).toBe("rect")
  if (solder_paste.shape === "rect") {
    expect(solder_paste.width).toBeCloseTo(2)
    expect(solder_paste.height).toBeCloseTo(1)
  }
})
