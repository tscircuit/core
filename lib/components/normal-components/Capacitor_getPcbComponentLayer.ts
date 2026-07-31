import type { LayerRef, SourceComponentBase } from "circuit-json"
import { getNormalComponentPcbLayer } from "lib/components/base-components/NormalComponent/get-normal-component-pcb-layer"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { getDecouplingCapacitorRelationshipsForRenderCycle } from "lib/utils/decoupling-capacitors/get-decoupling-capacitor-relationships"
import type { Capacitor } from "./Capacitor"

type SourceComponentId = SourceComponentBase["source_component_id"]

const findComponentBySourceComponentId = (
  component: PrimitiveComponent,
  sourceComponentId: SourceComponentId,
): PrimitiveComponent | undefined => {
  if (
    "source_component_id" in component &&
    component.source_component_id === sourceComponentId
  ) {
    return component
  }

  for (const child of component.children) {
    const matchingComponent = findComponentBySourceComponentId(
      child,
      sourceComponentId,
    )
    if (matchingComponent) return matchingComponent
  }

  return undefined
}

export const Capacitor_getPcbComponentLayer = (
  capacitor: Capacitor,
): LayerRef | undefined => {
  if (capacitor._parsedProps.layer !== undefined) {
    return capacitor._parsedProps.layer
  }

  const root = capacitor.root
  if (!root || !capacitor.source_component_id || !root.firstChild) {
    return undefined
  }

  const capacitorRelationships =
    getDecouplingCapacitorRelationshipsForRenderCycle(root).filter(
      (relationship) =>
        relationship.capacitorSourceComponent.source_component_id ===
        capacitor.source_component_id,
    )
  if (capacitorRelationships.length !== 1) return undefined

  const chipComponent = findComponentBySourceComponentId(
    root.firstChild,
    capacitorRelationships[0].chipSourceComponent.source_component_id,
  )
  if (!chipComponent) return undefined

  return getNormalComponentPcbLayer(chipComponent)
}
