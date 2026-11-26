import { expect, test } from "bun:test"
import { CourtyardPill } from "lib/components/primitive-components/CourtyardPill"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("courtyardpill renders pcb_courtyard_pill inside a chip footprint (#5920)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pcbX={2}
        pcbY={-1}
        footprint={
          <footprint>
            <courtyardpill
              pcbX={0}
              pcbY={0}
              width={8}
              height={3}
              radius={1.5}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pills = circuit.db.pcb_courtyard_pill.list()
  expect(pills).toHaveLength(1)
  expect(pills[0]!.center).toEqual({ x: 2, y: -1 })
  expect(pills[0]!.width).toBe(8)
  expect(pills[0]!.height).toBe(3)
  expect(pills[0]!.radius).toBe(1.5)
  expect(pills[0]!.layer).toBe("top")
  expect(pills[0]!.pcb_component_id).toBeTruthy()
})

test("courtyardpill flips to bottom layer when parent chip is on bottom", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        layer="bottom"
        footprint={
          <footprint>
            <courtyardpill pcbX={1} pcbY={2} width={6} height={2} radius={1} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pills = circuit.db.pcb_courtyard_pill.list()
  expect(pills).toHaveLength(1)
  expect(pills[0]!.layer).toBe("bottom")
  expect(pills[0]!.width).toBe(6)
  expect(pills[0]!.height).toBe(2)
  expect(pills[0]!.radius).toBe(1)
})

test("courtyardpill swaps width and height for 90-degree rotated parent chip", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pcbX={-5}
        pcbY={0}
        pcbRotation={90}
        footprint={
          <footprint>
            <courtyardpill
              pcbX={1}
              pcbY={0}
              width={8}
              height={3}
              radius={1.5}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pills = circuit.db.pcb_courtyard_pill.list()
  expect(pills).toHaveLength(1)
  expect(pills[0]!.center.x).toBeCloseTo(-5, 5)
  expect(pills[0]!.center.y).toBeCloseTo(1, 5)
  expect(pills[0]!.width).toBe(3)
  expect(pills[0]!.height).toBe(8)
  expect(pills[0]!.radius).toBe(1.5)
})

test("courtyardpill emits rotated pcb_courtyard_outline for non-90-degree rotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
        pcbRotation={30}
        footprint={
          <footprint>
            <courtyardpill
              pcbX={0}
              pcbY={0}
              width={8}
              height={3}
              radius={1.5}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_courtyard_pill.list()).toHaveLength(0)
  const outlines = circuit.db.pcb_courtyard_outline.list()
  expect(outlines).toHaveLength(1)
  expect(outlines[0]!.outline.length).toBeGreaterThanOrEqual(16)
  // Verify the outline is actually rotated ~30 degrees (maxY > 1.5, maxX < 4.0)
  const maxX = Math.max(...outlines[0]!.outline.map((p) => p.x))
  const maxY = Math.max(...outlines[0]!.outline.map((p) => p.y))
  expect(maxX).toBeGreaterThan(3.5)
  expect(maxX).toBeLessThan(3.95)
  expect(maxY).toBeGreaterThan(2.5)
})

test("createComponentsFromCircuitJson reconstructs CourtyardPill from pcb_courtyard_pill", () => {
  const components = createComponentsFromCircuitJson(
    { componentName: "U1", componentRotation: "0deg" },
    [
      {
        type: "pcb_courtyard_pill",
        pcb_courtyard_pill_id: "pcb_courtyard_pill_0",
        pcb_component_id: "pcb_component_0",
        center: { x: 3, y: 4 },
        width: 8,
        height: 3,
        radius: 1.5,
        layer: "top",
      },
    ],
  )

  expect(components).toHaveLength(1)
  expect(components[0]).toBeInstanceOf(CourtyardPill)
  expect(components[0]!.getPcbSize()).toEqual({ width: 8, height: 3 })
})
