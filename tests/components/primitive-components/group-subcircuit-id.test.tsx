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

test("Primitive components should have subcircuit_id", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group subcircuit name="G1">
      <resistor
        name="R1"
        resistance={100}
        footprint={"0402"}
        pcbX={1}
        pcbY={1}
      />
    </group>,
  )

  circuit.render()

  expect(circuit.db.pcb_smtpad.list()).toMatchInlineSnapshot(`
[
  {
    "height": 0.6000000000000001,
    "layer": "top",
    "pcb_component_id": "pcb_component_0",
    "pcb_port_id": "pcb_port_0",
    "pcb_smtpad_id": "pcb_smtpad_0",
    "port_hints": [
      "1",
      "left",
    ],
    "shape": "rect",
    "subcircuit_id": "subcircuit_source_group_0",
    "type": "pcb_smtpad",
    "width": 0.6000000000000001,
    "x": 0.5,
    "y": 1,
  },
  {
    "height": 0.6000000000000001,
    "layer": "top",
    "pcb_component_id": "pcb_component_0",
    "pcb_port_id": "pcb_port_1",
    "pcb_smtpad_id": "pcb_smtpad_1",
    "port_hints": [
      "2",
      "right",
    ],
    "shape": "rect",
    "subcircuit_id": "subcircuit_source_group_0",
    "type": "pcb_smtpad",
    "width": 0.6000000000000001,
    "x": 1.5,
    "y": 1,
  },
]
`)
})
