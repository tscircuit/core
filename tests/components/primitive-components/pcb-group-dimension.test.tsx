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
  expect(pcbGroups).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 0.6000000000000001,
        "is_subcircuit": true,
        "name": "G1",
        "pcb_component_ids": [],
        "pcb_group_id": "pcb_group_0",
        "source_group_id": "source_group_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_group",
        "width": 5.6,
      },
    ]
  `)
})
