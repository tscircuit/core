import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated_rect pads honor solderPasteMargin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rotated_rect"
        width={2}
        height={1}
        ccwRotation={45}
        solderPasteMargin={0}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  const [solder_paste] = circuit.db.pcb_solder_paste.list()
  expect(solder_paste.shape).toBe("rotated_rect")
  if (solder_paste.shape === "rotated_rect") {
    expect(solder_paste.width).toBeCloseTo(2)
    expect(solder_paste.height).toBeCloseTo(1)
    expect(solder_paste.ccw_rotation).toBeCloseTo(45)
  }
})
