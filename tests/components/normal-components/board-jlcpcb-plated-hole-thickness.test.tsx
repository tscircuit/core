import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("JLCPCB preset stackups include the plated hole copper thickness", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={20}
      layers={4}
      thickness="1.6mm"
      fabricatorPreset="jlcpcb_standard"
    />,
  )
  circuit.render()
  expect(circuit.db.pcb_stackup.list()[0].plated_hole_copper_thickness).toBe(
    0.018,
  )

  const { circuit: withoutPreset } = getTestFixture()
  withoutPreset.add(
    <board width={20} height={20} layers={4} thickness="1.6mm" />,
  )
  withoutPreset.render()
  expect(
    withoutPreset.db.pcb_stackup.list()[0]?.plated_hole_copper_thickness,
  ).toBeUndefined()
})
