import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group id present in pcb_component, schematic_component and source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group name="G1">
      <resistor name="R1" pcbX={-2} footprint={"0402"} resistance={100} />
      <resistor name="R2" pcbX={2} footprint={"0402"} resistance={100} />
    </group>,
  )

  circuit.renderUntilSettled()

  const pcbGroups = circuit.db.pcb_group.list()
})
