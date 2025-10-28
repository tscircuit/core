import { test, expect } from "bun:test"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import type { AnyCircuitElement } from "circuit-json"
import { Cutout } from "lib/components/primitive-components/Cutout"

test("createComponentsFromCircuitJson handles different cutout shapes", () => {
  // Create test circuit JSON with different cutout shapes
  const testSoup: AnyCircuitElement[] = [
    {
      type: "pcb_cutout",
      pcb_cutout_id: "cutout_1",
      shape: "rect",
      center: { x: 0, y: 0 },
      width: 5,
      height: 3,
      subcircuit_id: "test_subcircuit",
    },
    {
      type: "pcb_cutout",
      pcb_cutout_id: "cutout_2",
      shape: "circle",
      center: { x: 10, y: 10 },
      radius: 2,
      subcircuit_id: "test_subcircuit",
    },
    {
      type: "pcb_cutout",
      pcb_cutout_id: "cutout_3",
      shape: "polygon",
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 2 },
      ],
      subcircuit_id: "test_subcircuit",
    },
  ]

  const components = createComponentsFromCircuitJson(
    {
      componentName: "test_component",
      componentRotation: "0",
      footprinterString: "test",
      pinLabels: {},
    },
    testSoup,
  )

  // Verify all three cutout components were created
  const cutoutComponents = components.filter(
    (comp) => comp instanceof Cutout,
  ) as Cutout[]
  expect(cutoutComponents.length).toBe(3)

  // Verify rect cutout
  const rectCutout = cutoutComponents.find(
    (comp) => comp._parsedProps.shape === "rect",
  )
  expect(rectCutout).toBeDefined()
  expect(rectCutout!._parsedProps.pcbX).toBe(0)
  expect(rectCutout!._parsedProps.pcbY).toBe(0)
  expect((rectCutout!._parsedProps as any).width).toBe(5)
  expect((rectCutout!._parsedProps as any).height).toBe(3)

  // Verify circle cutout
  const circleCutout = cutoutComponents.find(
    (comp) => comp._parsedProps.shape === "circle",
  )
  expect(circleCutout).toBeDefined()
  expect(circleCutout!._parsedProps.pcbX).toBe(10)
  expect(circleCutout!._parsedProps.pcbY).toBe(10)
  expect((circleCutout!._parsedProps as any).radius).toBe(2)

  // Verify polygon cutout
  const polygonCutout = cutoutComponents.find(
    (comp) => comp._parsedProps.shape === "polygon",
  )
  expect(polygonCutout).toBeDefined()
  expect((polygonCutout!._parsedProps as any).points).toEqual([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 2 },
  ])
})
