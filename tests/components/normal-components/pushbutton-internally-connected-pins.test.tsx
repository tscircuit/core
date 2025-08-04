import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { grid } from "@tscircuit/math-utils"

test("pushbutton internally connected pins", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <pushbutton
        name="SW1"
        internallyConnectedPins={[["pin1", "pin2"]]}
        connections={{
          pin1: "net.PIN1",
          pin2: "net.PIN2",
        }}
        footprint="pushbutton_id1.3mm_od2mm"
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const schematicPorts = circuitJson.filter((e) => e.type === "schematic_port")

  expect(schematicPorts).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": -0.4724184500000006,
          "y": -0.051043499999999575,
        },
        "display_pin_label": undefined,
        "distance_from_component_edge": 0.4,
        "facing_direction": "left",
        "is_connected": false,
        "pin_number": 1,
        "schematic_component_id": "schematic_component_0",
        "schematic_port_id": "schematic_port_0",
        "side_of_component": undefined,
        "source_port_id": "source_port_0",
        "true_ccw_index": undefined,
        "type": "schematic_port",
      },
      {
        "center": {
          "x": 0.4724184500000006,
          "y": -0.051482499999999654,
        },
        "display_pin_label": undefined,
        "distance_from_component_edge": 0.4,
        "facing_direction": "right",
        "is_connected": false,
        "pin_number": 2,
        "schematic_component_id": "schematic_component_0",
        "schematic_port_id": "schematic_port_1",
        "side_of_component": undefined,
        "source_port_id": "source_port_1",
        "true_ccw_index": undefined,
        "type": "schematic_port",
      },
    ]
  `)

  // expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
