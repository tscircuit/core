import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ensure that nested groups correctly populate parent_source_group_id

test("nested group has parent_source_group_id", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group name="G1">
        <group name="G2">
          <resistor name="R1" footprint="0402" resistance={100} />
        </group>
      </group>
    </board>,
  )

  circuit.render()

  const groups = circuit.db.source_group.list()
  expect(groups).toMatchInlineSnapshot(`
    [
      {
        "is_subcircuit": undefined,
        "name": "G2",
        "parent_source_group_id": "source_group_1",
        "source_group_id": "source_group_0",
        "type": "source_group",
      },
      {
        "is_subcircuit": undefined,
        "name": "G1",
        "parent_source_group_id": "source_group_2",
        "source_group_id": "source_group_1",
        "type": "source_group",
      },
      {
        "is_subcircuit": true,
        "name": undefined,
        "source_group_id": "source_group_2",
        "subcircuit_id": "subcircuit_source_group_2",
        "type": "source_group",
      },
    ]
  `)
})
