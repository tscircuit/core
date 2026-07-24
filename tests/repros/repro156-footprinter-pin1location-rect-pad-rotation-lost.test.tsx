import { expect, test } from "bun:test"
import type { PcbSmtPadRotatedRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: Footprinter pin1location rect pad rotation is lost", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        pcbRotation={90}
        footprint="dfn_p1.2499mm_w4.0999mm_pl1.5mm_pin1location(leftside,bottom)"
      />
    </board>,
  )
  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const pads = circuit.db.pcb_smtpad
    .list()
    .filter(
      (element): element is PcbSmtPadRotatedRect =>
        element.type === "pcb_smtpad" && element.shape === "rotated_rect",
    )

  // 90° from the footprint plus 90° from the chip must yield 180°.
  expect(pads).toHaveLength(0)
  expect(pads.map((pad) => pad.ccw_rotation)).toEqual([])
})
