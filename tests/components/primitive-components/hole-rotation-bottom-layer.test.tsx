import { expect, test } from "bun:test"
import type { PcbHoleRotatedPill, PcbSmtPadRotatedPill } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pill holes in a rotated bottom-side footprint match the mirrored pad angle", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        layer="bottom"
        pcbRotation={30}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width="3mm"
              height="1mm"
              radius="0.5mm"
              portHints={["1"]}
              pcbX={0}
              pcbY={2}
            />
            <hole shape="pill" width="3mm" height="1mm" pcbX={0} pcbY={-2} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pad = circuit.db.pcb_smtpad.list()[0] as PcbSmtPadRotatedPill
  const hole = circuit.db.pcb_hole.list()[0] as PcbHoleRotatedPill

  expect(pad.shape).toBe("rotated_pill")
  expect(hole.hole_shape).toBe("rotated_pill")
  expect(hole.ccw_rotation).toBeCloseTo(pad.ccw_rotation)
})
