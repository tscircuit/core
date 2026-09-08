import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbHoleWithPolygonPad } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("plated hole with polygon pad retains component rotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pcbRotation={90}
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX={3}
              pcbY={0}
              shape="hole_with_polygon_pad"
              holeShape="circle"
              holeDiameter={1}
              holeOffsetX={0}
              holeOffsetY={0}
              padOutline={[
                { x: -2, y: -0.5 },
                { x: 2, y: -0.5 },
                { x: 2, y: 0.5 },
                { x: -2, y: 0.5 },
              ]}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles).toHaveLength(1)

  const hole = platedHoles[0] as PcbHoleWithPolygonPad
  expect(hole.shape).toBe("hole_with_polygon_pad")
  expect(hole.ccw_rotation).toBe(90)
  expect(hole.x).toBeCloseTo(0, 5)
  expect(hole.y).toBeCloseTo(3, 5)
  expect(hole.pad_outline).toEqual([
    { x: -2, y: -0.5 },
    { x: 2, y: -0.5 },
    { x: 2, y: 0.5 },
    { x: -2, y: 0.5 },
  ])
})

test("plated hole with polygon pad direct pcbRotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <platedhole
        shape="hole_with_polygon_pad"
        holeShape="circle"
        holeDiameter={1}
        holeOffsetX={0}
        holeOffsetY={0}
        pcbX={2}
        pcbY={1}
        pcbRotation={45}
        padOutline={[
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: 1, y: 1 },
          { x: -1, y: 1 },
        ]}
      />
    </board>,
  )

  circuit.render()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles).toHaveLength(1)

  const hole = platedHoles[0] as PcbHoleWithPolygonPad
  expect(hole.shape).toBe("hole_with_polygon_pad")
  expect(hole.ccw_rotation).toBe(45)
  expect(hole.x).toBe(2)
  expect(hole.y).toBe(1)
})

test("createComponentsFromCircuitJson preserves ccw_rotation on hole_with_polygon_pad", () => {
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
        hole_shape: "circle",
        hole_diameter: 1,
        hole_offset_x: 0,
        hole_offset_y: 0,
        ccw_rotation: 60,
        layers: ["top", "bottom"],
        pad_outline: [
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: 1, y: 1 },
          { x: -1, y: 1 },
        ],
        port_hints: ["pin1"],
      },
    ] as AnyCircuitElement[],
  )

  for (const component of importedComponents) {
    footprint.add(component)
  }

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" layer="top" footprint={footprint as any} />
    </board>,
  )

  circuit.render()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles).toHaveLength(1)

  const hole = platedHoles[0] as PcbHoleWithPolygonPad
  expect(hole.shape).toBe("hole_with_polygon_pad")
  expect(hole.ccw_rotation).toBe(60)
})
