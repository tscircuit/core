import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

test("schematic manualEdits inside positioned groups stay in board coordinates", () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board
      width="40mm"
      height="20mm"
      manualEdits={{
        schematic_placements: [
          {
            selector: "R1",
            center: { x: 9, y: 3 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <group name="region" schX={12} schY={0}>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          connections={{ pin1: "net.VCC", pin2: "net.GND" }}
        />
      </group>
    </board>,
  )

  circuit.render()

  const sourceComponent = circuit.db.source_component
    .list()
    .find((component) => component.name === "R1")
  const schematicComponent = circuit.db.schematic_component
    .list()
    .find(
      (component) =>
        component.source_component_id === sourceComponent?.source_component_id,
    )

  expect(schematicComponent?.center.x).toBeCloseTo(9, 6)
  expect(schematicComponent?.center.y).toBeCloseTo(3, 6)
})
