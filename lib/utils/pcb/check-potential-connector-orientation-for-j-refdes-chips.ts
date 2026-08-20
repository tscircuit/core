import { checkConnectorAccessibleOrientation } from "@tscircuit/checks"
import type {
  AnyCircuitElement,
  PcbComponent,
  SourceSimpleChip,
} from "circuit-json"
import { inferCableInsertionCenterForComponent } from "./infer-cable-insertion-center-for-component"

export const checkPotentialConnectorOrientationForJRefdesChips = (
  circuitJson: AnyCircuitElement[],
) => {
  const potentialConnectorSourceComponentIds = new Set(
    circuitJson
      .filter(
        (element): element is SourceSimpleChip =>
          element.type === "source_component" &&
          "ftype" in element &&
          element.ftype === "simple_chip",
      )
      .filter((component) => component.name.toUpperCase().startsWith("J"))
      .map((component) => component.source_component_id),
  )
  if (potentialConnectorSourceComponentIds.size === 0) return []

  const potentialConnectorPcbComponentIds = new Set(
    circuitJson
      .filter(
        (element): element is PcbComponent => element.type === "pcb_component",
      )
      .filter((component) =>
        potentialConnectorSourceComponentIds.has(component.source_component_id),
      )
      .map((component) => component.pcb_component_id),
  )

  const circuitJsonForOrientationCheck = circuitJson.map((element) => {
    if (
      element.type !== "pcb_component" ||
      !potentialConnectorPcbComponentIds.has(element.pcb_component_id) ||
      !element.source_component_id
    ) {
      return element
    }

    const inferredCenter = inferCableInsertionCenterForComponent({
      circuitJson,
      pcbComponentId: element.pcb_component_id,
      sourceComponentId: element.source_component_id,
    })
    if (!inferredCenter) return element

    // This metadata exists only in the input to the orientation check. A generic
    // chip must never gain connector metadata in the rendered Circuit JSON.
    return { ...element, cable_insertion_center: inferredCenter }
  })

  return checkConnectorAccessibleOrientation(
    circuitJsonForOrientationCheck,
  ).filter((warning) =>
    potentialConnectorPcbComponentIds.has(warning.pcb_component_id),
  )
}
