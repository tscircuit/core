import { getPcbElementBounds } from "@tscircuit/circuit-json-util"
import type { ComponentId, InputObstacle } from "calculate-packing"
import type { LayerRef } from "circuit-json"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { applyToPoint, inverse } from "transformation-matrix"
import type { Group } from "../Group"

/**
 * Return fixed-component collision boxes in group-local PCB coordinates (mm,
 * right-handed, +X right, +Y top, +Z above). Circuit-world bounds are transformed
 * as points by the inverse of the placement transform used by applyPackOutput.
 */
export const getOutsideFixedComponentObstacles = (
  group: Group,
  targetLayer: LayerRef | undefined,
): InputObstacle[] => {
  const board = group._getBoard()
  if (!board || group.lowercaseComponentName === "board") return []
  const fixedComponentIds = new Set<ComponentId>()
  const collectFixedComponents = (component: PrimitiveComponent) => {
    if (component === group) return
    const normalComponent = component as NormalComponent
    if (
      normalComponent.pcb_component_id &&
      normalComponent.isRelativelyPositioned?.()
    ) {
      fixedComponentIds.add(normalComponent.pcb_component_id)
    }
    for (const child of component.children) collectFixedComponents(child)
  }
  collectFixedComponents(board)
  const worldToGroup = inverse(group._computePcbGlobalTransformBeforeLayout())
  const circuitJson = group.root!.db.toArray()
  return Array.from(fixedComponentIds).flatMap((pcbComponentId) => {
    const localPoints = circuitJson.flatMap((element) => {
      if (
        !("pcb_component_id" in element) ||
        element.pcb_component_id !== pcbComponentId
      )
        return []
      if (
        !(
          element.type.startsWith("pcb_courtyard_") ||
          element.type === "pcb_smtpad" ||
          element.type === "pcb_plated_hole"
        )
      )
        return []
      if (targetLayer && "layer" in element && element.layer !== targetLayer)
        return []
      if (
        targetLayer &&
        "layers" in element &&
        !element.layers.includes(targetLayer)
      )
        return []
      const bounds = getPcbElementBounds(element)
      if (!bounds) return []
      return [
        { x: bounds.minX, y: bounds.minY },
        { x: bounds.minX, y: bounds.maxY },
        { x: bounds.maxX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.maxY },
      ].map((point) => applyToPoint(worldToGroup, point))
    })
    if (!localPoints.length) return []
    const minX = Math.min(...localPoints.map((p) => p.x))
    const maxX = Math.max(...localPoints.map((p) => p.x))
    const minY = Math.min(...localPoints.map((p) => p.y))
    const maxY = Math.max(...localPoints.map((p) => p.y))
    return [
      {
        obstacleId: pcbComponentId,
        absoluteCenter: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        width: maxX - minX,
        height: maxY - minY,
      },
    ]
  })
}
