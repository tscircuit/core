import { transformPCBElements } from "@tscircuit/circuit-json-util"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbComponent } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { compose, inverse, rotate, translate } from "transformation-matrix"

/**
 * Extracts PCB primitive components (pads, holes, silkscreen, etc.) from circuit JSON
 * and returns them as an array of component instances.
 *
 * @param pcbElm - The PCB component element from circuit JSON
 * @param injectionDb - The circuit JSON utility objects for querying related elements
 * @param componentName - The name of the parent component (used for silkscreen text)
 * @returns Array of primitive components (SmtPad, PlatedHole, SilkscreenPath, etc.)
 */
export const extractPcbPrimitivesFromCircuitJson = ({
  pcbComponent,
  db,
  componentName,
}: {
  pcbComponent: PcbComponent
  db: CircuitJsonUtilObjects
  componentName: string
}): PrimitiveComponent[] => {
  // Get the component center and rotation to make primitive positions relative
  const componentCenter = pcbComponent.center || { x: 0, y: 0 }
  const componentRotation = pcbComponent.rotation || 0 // rotation in degrees

  // Create inverse transform to convert from global to component-local coordinates
  // This uses the same transformation matrix approach as the rest of the codebase
  const absoluteToComponentRelativeTransform = inverse(
    compose(
      translate(componentCenter.x, componentCenter.y),
      rotate((componentRotation * Math.PI) / 180),
    ),
  )

  // Get all elements related to this PCB component
  const relativeElements = db
    .toArray()
    .filter(
      (elm) =>
        "pcb_component_id" in elm &&
        elm.pcb_component_id === pcbComponent.pcb_component_id,
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
      componentName,
      componentRotation: "0deg",
    },
    clonedRelativeElements,
  )

  return components
}
