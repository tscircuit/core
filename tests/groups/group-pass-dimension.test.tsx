import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group dimension matches with the passed dimension", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <group subcircuit width="10mm" height="10mm">
      <resistor name="R1" footprint="0402" resistance="10k" />
      <capacitor name="C1" capacitance="10uF" footprint="0603" />
    </group>,
  )
  await circuit.renderUntilSettled()

  const pcbGroups = circuit.db.pcb_group.list()
  expect(pcbGroups.length).toBe(1)
  expect(pcbGroups[0].width).toBe(10)
  expect(pcbGroups[0].height).toBe(10)
})
