import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pack inside group width and height specified", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group subcircuit pack width="5mm" height="5mm" pcbX={2.5} pcbY={-2.5}>
        <resistor name="R2" resistance="1k" footprint="0402" />
        <capacitor name="C2" capacitance="100nF" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcb_components = circuit.db.pcb_component.list()
  expect(pcb_components).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 2.5,
          "y": -2.5,
        },
        "do_not_place": false,
        "height": 0.6399999999999997,
        "layer": "top",
        "obstructs_within_bounds": true,
        "pcb_component_id": "pcb_component_0",
        "pcb_group_id": "pcb_group_0",
        "rotation": 0,
        "source_component_id": "source_component_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_component",
        "width": 1.5599999999999998,
      },
      {
        "center": {
          "x": 2.5,
          "y": -0.8600000000000001,
        },
        "do_not_place": false,
        "height": 0.6399999999999997,
        "layer": "top",
        "obstructs_within_bounds": true,
        "pcb_component_id": "pcb_component_1",
        "pcb_group_id": "pcb_group_0",
        "rotation": 0,
        "source_component_id": "source_component_1",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_component",
        "width": 1.5599999999999998,
      },
    ]
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
