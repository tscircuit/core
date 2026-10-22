import { transformPCBElements } from "@tscircuit/circuit-json-util"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbComponent } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import {
  compose,
  decomposeTSR,
  inverse,
  rotate,
  translate,
} from "transformation-matrix"

/**
 * Extracts PCB primitive components (pads, holes, silkscreen, etc.) from circuit JSON
 * and returns them as an array of component instances.
 * Saved positions and CCW angles are in board space (mm, +X right, +Y up).
 * Returned positions and angles use the component-local frame with the same axes.
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
  transformPCBElements(
    clonedRelativeElements,
    absoluteToComponentRelativeTransform,
  )

  // transformPCBElements moves text anchors but leaves text angles unchanged.
  // Convert their orientations with the same board-to-component transform.
  for (const elm of clonedRelativeElements) {
    if (elm.type !== "pcb_silkscreen_text") continue
    const orientation = decomposeTSR(
      compose(
        absoluteToComponentRelativeTransform,
        rotate(((elm.ccw_rotation ?? 0) * Math.PI) / 180),
      ),
    )
    elm.ccw_rotation = (orientation.rotation.angle * 180) / Math.PI
  }

  return createComponentsFromCircuitJson(
    {
      componentName,
      componentRotation: "0deg",
      // Rendered footprints must retain missing apertures as well as geometry.
      preserveSolderPaste: true,
      preserveSilkscreenText: true,
    },
    clonedRelativeElements,
  )
}
