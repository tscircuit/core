import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group pcb bounds include holes", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group name="HoleGroup" subcircuit>
      <hole name="H1" diameter="2mm" pcbX={0} pcbY={0} />
      <hole name="H2" diameter="2mm" pcbX={10} pcbY={0} />
    </group>,
  )

  circuit.renderUntilSettled()

  const [pcbGroup] = circuit.db.pcb_group.list()

  expect(pcbGroup.width).toBeCloseTo(12)
  expect(pcbGroup.height).toBeCloseTo(2)
})
