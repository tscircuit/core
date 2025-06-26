import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor should have subcircuit_id on it's elements", async () => {
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
        "height": 0.6,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": "pcb_group_0",
        "pcb_port_id": "pcb_port_0",
        "pcb_smtpad_id": "pcb_smtpad_0",
        "port_hints": [
          "1",
          "left",
        ],
        "shape": "rect",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_smtpad",
        "width": 0.6,
        "x": 0.5,
        "y": 1,
      },
      {
        "height": 0.6,
        "layer": "top",
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": "pcb_group_0",
        "pcb_port_id": "pcb_port_1",
        "pcb_smtpad_id": "pcb_smtpad_1",
        "port_hints": [
          "2",
          "right",
        ],
        "shape": "rect",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_smtpad",
        "width": 0.6,
        "x": 1.5,
        "y": 1,
      },
    ]
  `)
})
