import { test, expect } from "bun:test"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { fp } from "@tscircuit/footprinter"
import type { AnyCircuitElement } from "circuit-json"
import { Cutout } from "lib/components/primitive-components/Cutout"

test("createComponentsFromCircuitJson handles pcb_cutout elements", () => {
  // Get the m2host footprint soup
  const m2hostSoup = fp.string("m2host").soup() as AnyCircuitElement[]

  // Find the pcb_cutout element in the soup
  const cutoutElement = m2hostSoup.find((elm) => elm.type === "pcb_cutout")

  expect(cutoutElement).toBeDefined()
  expect(cutoutElement?.type).toBe("pcb_cutout")
  expect(cutoutElement?.shape).toBe("rect")

  // Create components from the circuit JSON
  const components = createComponentsFromCircuitJson(
    {
      componentName: "m2host",
      componentRotation: "0",
      footprinterString: "m2host",
      pinLabels: {},
    },
    m2hostSoup,
  )

  // Find the Cutout component that was created
  const cutoutComponent = components.find(
    (comp) => comp instanceof Cutout,
  ) as Cutout

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
  const smtPadComponents = components.filter(
    (comp) => comp.componentName === "SmtPad",
  )
  expect(smtPadComponents.length).toBeGreaterThan(0)

  const silkscreenPathComponents = components.filter(
    (comp) => comp.componentName === "SilkscreenPath",
  )
  expect(silkscreenPathComponents.length).toBeGreaterThan(0)
})
