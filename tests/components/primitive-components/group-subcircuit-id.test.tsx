import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Subcircuit group should have subcircuit_id", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<group name="G1" subcircuit />)

  circuit.render()

  expect(circuit.db.toArray().map((c) => c.type)).toMatchInlineSnapshot(`
[
  "source_group",
  "pcb_group",
]
`)

  expect(circuit.db.source_group.list()).toMatchInlineSnapshot(`
[
  {
    "is_subcircuit": true,
    "name": "G1",
    "source_group_id": "source_group_0",
    "subcircuit_id": "subcircuit_source_group_0",
    "type": "source_group",
  },
]
`)

  expect(circuit.db.pcb_group.list()).toMatchInlineSnapshot(`
[
  {
    "center": {
      "x": 0,
      "y": 0,
    },
    "height": 0,
    "is_subcircuit": true,
    "name": "G1",
    "pcb_component_ids": [],
    "pcb_group_id": "pcb_group_0",
    "source_group_id": "source_group_0",
    "subcircuit_id": "subcircuit_source_group_0",
    "type": "pcb_group",
    "width": 0,
  },
]
`)
})
