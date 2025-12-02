import type { SourceComponentBase, PcbComponent } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { compose, translate, rotate, inverse } from "transformation-matrix"
import { transformPCBElements } from "@tscircuit/circuit-json-util"

export const inflatePcbComponent = (
  pcbElm: PcbComponent,
  inflatorContext: InflatorContext,
) => {
  const { injectionDb, normalComponent } = inflatorContext
  if (!normalComponent) return

  // Get the component center and rotation to make primitive positions relative
  const componentCenter = pcbElm.center || { x: 0, y: 0 }
  const componentRotation = pcbElm.rotation || 0 // rotation in degrees

  // Create inverse transform to convert from global to component-local coordinates
  // This uses the same transformation matrix approach as the rest of the codebase
  const absoluteToComponentRelativeTransform = inverse(
    compose(
      translate(componentCenter.x, componentCenter.y),
      rotate((componentRotation * Math.PI) / 180),
    ),
  )

  // Get all elements related to this PCB component
  const relativeElements = injectionDb
    .toArray()
    .filter(
      (elm) =>
        "pcb_component_id" in elm &&
        elm.pcb_component_id === pcbElm.pcb_component_id,
    )

  const clonedRelativeElements = structuredClone(relativeElements)

  // Transform all PCB elements using the standard transformation utility
  // This handles all element types (holes, pads, keepouts, silkscreen, etc.)
  transformPCBElements(
    clonedRelativeElements,
    absoluteToComponentRelativeTransform,
  )

  const components = createComponentsFromCircuitJson(
    {
      componentName: normalComponent.name,
      componentRotation: "0deg",
    },
    clonedRelativeElements,
  )

  normalComponent.addAll(components)
}
