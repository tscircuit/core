import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group with outline specified", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group
        subcircuit
        outline={[
          { x: -4, y: 0 },
          { x: 4, y: -4 },
          { x: 4, y: 4 },
          { x: -4, y: 4 },
        ]}
      >
        <resistor name="R2" resistance="1k" footprint="0402" />
        <capacitor name="C2" capacitance="100nF" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()
  const pcb_groups = circuit.db.pcb_group.list()
  expect(pcb_groups).toMatchInlineSnapshot(`
    [
      {
        "autorouter_configuration": undefined,
        "center": {
          "x": 0,
          "y": 0,
        },
        "is_subcircuit": true,
        "name": "unnamed_group1",
        "outline": [
          {
            "x": -4,
            "y": 0,
          },
          {
            "x": 4,
            "y": -4,
          },
          {
            "x": 4,
            "y": 4,
          },
          {
            "x": -4,
            "y": 4,
          },
        ],
        "pcb_component_ids": [],
        "pcb_group_id": "pcb_group_0",
        "source_group_id": "source_group_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_group",
      },
    ]
  `)
})
