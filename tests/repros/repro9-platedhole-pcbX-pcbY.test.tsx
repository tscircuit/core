import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board with resistor being passed schX and pcbX in mm", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance={10}
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX="-4"
              pcbY="0"
              shape="circle"
              outerDiameter={1.2}
              holeDiameter={1}
            />
            <platedhole
              portHints={["pin2"]}
              pcbX="3"
              pcbY="0"
              shape="circle"
              outerDiameter={2.2}
              holeDiameter={2}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_component.list()).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": -0.25,
          "y": 0,
        },
        "do_not_place": false,
        "height": 2.2,
        "layer": "top",
        "metadata": undefined,
        "obstructs_within_bounds": true,
        "pcb_component_id": "pcb_component_0",
        "rotation": 0,
        "source_component_id": "source_component_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_component",
        "width": 8.7,
      },
    ]
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
