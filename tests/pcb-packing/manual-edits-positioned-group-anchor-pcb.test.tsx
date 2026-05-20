import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

test("pcb manualEdits inside positioned groups stay in board coordinates", () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board
      width="40mm"
      height="20mm"
      manualEdits={{
        pcb_placements: [
          {
            selector: "C1",
            center: { x: 11.4, y: 4.3 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <group name="region" pcbX={16} pcbY={0}>
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ pin1: "VCC", pin8: "GND" }}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          connections={{ pin1: "U1.VCC", pin2: "U1.GND" }}
        />
      </group>
    </board>,
  )

  circuit.render()

  const sourceComponent = circuit.db.source_component
    .list()
    .find((component) => component.name === "C1")
  const pcbComponent = circuit.db.pcb_component
    .list()
    .find(
      (component) =>
        component.source_component_id === sourceComponent?.source_component_id,
    )

  expect(pcbComponent?.center.x).toBeCloseTo(11.4, 6)
  expect(pcbComponent?.center.y).toBeCloseTo(4.3, 6)
})
