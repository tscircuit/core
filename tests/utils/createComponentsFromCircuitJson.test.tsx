import { test, expect } from "bun:test"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { fp } from "@tscircuit/footprinter"
import type { AnyCircuitElement } from "circuit-json"
import { Cutout } from "lib/components/primitive-components/Cutout"

test("createComponentsFromCircuitJson handles pcb_cutout elements", () => {
  // Get the m2host footprint soup
  const m2hostSoup = fp.string("m2host").soup() as AnyCircuitElement[]
  
  // Find the pcb_cutout element in the soup
  const cutoutElement = m2hostSoup.find(elm => elm.type === "pcb_cutout")
  
  expect(cutoutElement).toBeDefined()
  expect(cutoutElement?.type).toBe("pcb_cutout")
  expect(cutoutElement?.shape).toBe("rect")
  
  // Create components from the circuit JSON
  const components = createComponentsFromCircuitJson(
    {
      componentName: "m2host",
      componentRotation: "0",
      footprint: "m2host",
      pinLabels: {},
    },
    m2hostSoup,
  )
  
  // Find the Cutout component that was created
  const cutoutComponent = components.find(comp => comp instanceof Cutout) as Cutout
  
  expect(cutoutComponent).toBeDefined()
  expect(cutoutComponent.componentName).toBe("Cutout")
  
  // Verify the cutout properties match the original circuit JSON
  const cutoutProps = cutoutComponent._parsedProps
  expect(cutoutProps.shape).toBe("rect")
  expect(cutoutProps.pcbX).toBe((cutoutElement as any).center.x)
  expect(cutoutProps.pcbY).toBe((cutoutElement as any).center.y)
  expect((cutoutProps as any).width).toBe((cutoutElement as any).width)
  expect((cutoutProps as any).height).toBe((cutoutElement as any).height)
  
  // Verify that other component types are also created
  const smtPadComponents = components.filter(comp => comp.componentName === "SmtPad")
  expect(smtPadComponents.length).toBeGreaterThan(0)
  
  const silkscreenPathComponents = components.filter(comp => comp.componentName === "SilkscreenPath")
  expect(silkscreenPathComponents.length).toBeGreaterThan(0)
})

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
      footprint: "test",
      pinLabels: {},
    },
    testSoup,
  )
  
  // Verify all three cutout components were created
  const cutoutComponents = components.filter(comp => comp instanceof Cutout) as Cutout[]
  expect(cutoutComponents.length).toBe(3)
  
  // Verify rect cutout
  const rectCutout = cutoutComponents.find(comp => comp._parsedProps.shape === "rect")
  expect(rectCutout).toBeDefined()
  expect(rectCutout!._parsedProps.pcbX).toBe(0)
  expect(rectCutout!._parsedProps.pcbY).toBe(0)
  expect((rectCutout!._parsedProps as any).width).toBe(5)
  expect((rectCutout!._parsedProps as any).height).toBe(3)
  
  // Verify circle cutout
  const circleCutout = cutoutComponents.find(comp => comp._parsedProps.shape === "circle")
  expect(circleCutout).toBeDefined()
  expect(circleCutout!._parsedProps.pcbX).toBe(10)
  expect(circleCutout!._parsedProps.pcbY).toBe(10)
  expect((circleCutout!._parsedProps as any).radius).toBe(2)
  
  // Verify polygon cutout
  const polygonCutout = cutoutComponents.find(comp => comp._parsedProps.shape === "polygon")
  expect(polygonCutout).toBeDefined()
  expect((polygonCutout!._parsedProps as any).points).toEqual([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 2 },
  ])
}) 
