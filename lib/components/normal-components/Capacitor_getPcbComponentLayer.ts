import type { LayerRef, SourceComponentBase } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { getDecouplingCapacitorRelationships } from "lib/utils/decoupling-capacitors/get-decoupling-capacitor-relationships"
import type { Capacitor } from "./Capacitor"

type SourceComponentId = SourceComponentBase["source_component_id"]

interface PcbLayerResolver {
  _getPcbComponentLayer(): LayerRef | undefined
}

const findComponentBySourceComponentId = (
  rootComponent: PrimitiveComponent,
  sourceComponentId: SourceComponentId,
): PrimitiveComponent | undefined =>
  [rootComponent, ...rootComponent.getDescendants()].find(
    (component) =>
      "source_component_id" in component &&
      component.source_component_id === sourceComponentId,
  )

export const Capacitor_getPcbComponentLayer = (
  capacitor: Capacitor,
): LayerRef | undefined => {
  if (capacitor._parsedProps.layer !== undefined) return undefined
  if (capacitor.isRelativelyPositioned()) return undefined
  if (
    capacitor.getSubcircuit()._getPcbManualPlacementForComponent(capacitor) !==
    null
  ) {
    return undefined
  }

  const root = capacitor.root
  if (!root?.firstChild || !capacitor.source_component_id) return undefined

  const matchingRelationships = getDecouplingCapacitorRelationships(
    root.db,
  ).filter(
    (relationship) =>
      relationship.capacitorSourceComponent.source_component_id ===
      capacitor.source_component_id,
  )
  if (matchingRelationships.length !== 1) return undefined

  const chipComponent = findComponentBySourceComponentId(
    root.firstChild,
    matchingRelationships[0].chipSourceComponent.source_component_id,
  )
  if (!chipComponent || !("_getPcbComponentLayer" in chipComponent)) {
    return undefined
  }

  return (chipComponent as unknown as PcbLayerResolver)._getPcbComponentLayer()
}
