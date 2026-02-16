import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group pcb padding", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <group
      name="G1"
      pcbLayout={{
        padding: 10,
      }}
      subcircuit
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
    </group>,
  )

  await circuit.renderUntilSettled()

  const pcbGroups = circuit.db.pcb_group.list()
  expect(pcbGroups.length).toBe(1)
  expect(pcbGroups[0].width).toBeCloseTo(25.6, 1)
  expect(pcbGroups[0].height).toBeCloseTo(20.6, 1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
