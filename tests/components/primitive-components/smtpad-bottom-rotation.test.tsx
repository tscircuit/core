import { expect, test } from "bun:test"
import type {
  PcbSmtPadRotatedRect,
  PcbSolderPasteRotatedRect,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("smt pads on the bottom layer preserve their rotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="U1"
        pcbX={-3}
        layer="bottom"
        footprint="0402"
        resistance={20}
        pcbRotation={110}
      />
      <resistor
        name="U2"
        pcbX={3}
        layer="bottom"
        footprint="0402"
        resistance={10}
        pcbRotation={85}
      />
      <resistor
        name="U3"
        pcbX={0}
        layer="bottom"
        footprint="0402"
        resistance={10}
        pcbRotation={230}
      />
    </board>,
  )

  circuit.render()

  const pads = circuit.db.pcb_smtpad.list()
  const topPad = pads.find(
    (pad): pad is PcbSmtPadRotatedRect =>
      pad.layer === "bottom" && pad.shape === "rotated_rect",
  )
  const bottomPad = pads.find(
    (pad): pad is PcbSmtPadRotatedRect =>
      pad.layer === "bottom" && pad.shape === "rotated_rect",
  )

  expect(topPad).toBeDefined()
  expect(bottomPad).toBeDefined()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatch3dSnapshot(import.meta.path, {
    cameraPreset: "bottom_angled",
  })
})
