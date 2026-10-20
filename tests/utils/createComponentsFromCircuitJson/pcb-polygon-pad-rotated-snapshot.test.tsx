import { expect, test } from "bun:test"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("createComponentsFromCircuitJson preserves imported polygon plated-hole rotation", async () => {
  const { circuit } = getTestFixture()
  const footprint = new Footprint({})

  const importedComponents = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0",
    },
    [
      {
        type: "pcb_plated_hole",
        shape: "hole_with_polygon_pad",
        pcb_plated_hole_id: "pcb_plated_hole_0",
        x: 0,
        y: 0,
        hole_shape: "pill",
        hole_width: 1.9,
        hole_height: 0.6,
        hole_offset_x: 0.4,
        hole_offset_y: -0.25,
        pad_outline: [
          { x: -2, y: -1 },
          { x: 2, y: -1 },
          { x: 1, y: 1 },
          { x: -2, y: 1 },
        ],
        ccw_rotation: 45,
        layers: ["top", "bottom"],
        port_hints: ["pin1"],
      },
    ],
  )

  for (const component of importedComponents) {
    footprint.add(component)
  }

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" layer="top" footprint={footprint as any} />
      <pcbnotetext text="Imported pad: 45 degrees" pcbY={-3} fontSize={0.4} />
    </board>,
  )

  circuit.render()

  const platedHoles = circuit.db.pcb_plated_hole
    .list()
    .filter((hole) => hole.shape === "hole_with_polygon_pad")

  expect(platedHoles).toHaveLength(1)
  expect(platedHoles[0].ccw_rotation).toBeCloseTo(45)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
