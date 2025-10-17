import { expect, test } from "bun:test"
import type {
  PcbSmtPadRotatedRect,
  PcbSolderPasteRotatedRect,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("smt pads on the bottom layer preserve their rotation", async () => {
  const { circuit } = getTestFixture()

  const footprint = (
    <footprint>
      <smtpad
        shape="rect"
        width="0.8mm"
        height="0.4mm"
        pcbRotation={45}
        portHints={["1"]}
      />
    </footprint>
  )

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" pcbX={-2} layer="top" footprint={footprint} />
      <chip name="U2" pcbX={2} layer="bottom" footprint={footprint} />
    </board>,
  )

  circuit.render()

  const pads = circuit.db.pcb_smtpad.list()
  const topPad = pads.find(
    (pad): pad is PcbSmtPadRotatedRect =>
      pad.layer === "top" && pad.shape === "rotated_rect",
  )
  const bottomPad = pads.find(
    (pad): pad is PcbSmtPadRotatedRect =>
      pad.layer === "bottom" && pad.shape === "rotated_rect",
  )

  expect(topPad).toBeDefined()
  expect(bottomPad).toBeDefined()
  expect(topPad?.ccw_rotation).toBe(45)
  expect(bottomPad?.ccw_rotation).toBe(45)

  const solderPastes = circuit.db.pcb_solder_paste.list()
  const bottomPaste = solderPastes.find(
    (paste): paste is PcbSolderPasteRotatedRect =>
      paste.layer === "bottom" && paste.shape === "rotated_rect",
  )

  expect(bottomPaste).toBeDefined()
  expect(bottomPaste?.ccw_rotation).toBe(45)
})
