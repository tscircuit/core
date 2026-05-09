import type { Group } from "../Group"
import { translate, rotate, compose } from "transformation-matrix"
import {
  transformPCBElements,
  type CircuitJsonUtilObjects,
} from "@tscircuit/circuit-json-util"
import type { PackOutput } from "calculate-packing"
import type { ClusterInfo } from "./applyComponentConstraintClusters"
import { normalizeDegrees } from "@tscircuit/math-utils"

const updateCadRotation = ({
  db,
  pcbComponentId,
  rotationDegrees,
  layer,
}: {
  db: CircuitJsonUtilObjects
  pcbComponentId: string
  rotationDegrees: number
  layer?: string
}) => {
  if (rotationDegrees == null) return
  if (!db?.cad_component?.list) return

  const cadComponent = db.cad_component.getWhere({
    pcb_component_id: pcbComponentId,
  })
  if (!cadComponent) return

  const delta =
    layer?.toLowerCase?.() === "bottom" ? -rotationDegrees : rotationDegrees

  const currentRotationZ = cadComponent.rotation?.z ?? 0
  const nextRotation = {
    ...(cadComponent.rotation ?? { x: 0, y: 0, z: 0 }),
    z: normalizeDegrees(currentRotationZ + delta),
  }

  db.cad_component.update(cadComponent.cad_component_id, {
    rotation: nextRotation,
  })
  cadComponent.rotation = nextRotation
}

const isDescendantGroup = (
  db: any,
  groupId: string,
  ancestorId: string,
): boolean => {
  if (groupId === ancestorId) return true
  const group = db.source_group.get(groupId)
  if (!group || !group.parent_source_group_id) return false
  return isDescendantGroup(db, group.parent_source_group_id, ancestorId)
}

export const applyPackOutput = (
  group: Group,
  packOutput: PackOutput,
  clusterMap: Record<string, ClusterInfo>,
) => {
  const { db } = group.root!

  for (const packedComponent of packOutput.components) {
    const { center, componentId, ccwRotationOffset, ccwRotationDegrees } =
      packedComponent

    const cluster = clusterMap[componentId]
    if (cluster) {
      const rotationDegrees = ccwRotationDegrees ?? ccwRotationOffset ?? 0
      const angleRad = (rotationDegrees * Math.PI) / 180
      for (const memberId of cluster.componentIds) {
        const rel = cluster.relativeCenters![memberId]
        if (!rel) continue
        db.pcb_component.update(memberId, {
          position_mode: "packed",
        })
        const rotatedRel = {
          x: rel.x * Math.cos(angleRad) - rel.y * Math.sin(angleRad),
          y: rel.x * Math.sin(angleRad) + rel.y * Math.cos(angleRad),
        }
        const member = db.pcb_component.get(memberId)
        if (!member) continue
        const originalCenter = member.center
        const transformMatrix = compose(
          group._computePcbGlobalTransformBeforeLayout(),
          translate(center.x + rotatedRel.x, center.y + rotatedRel.y),
          rotate(angleRad),
          translate(-originalCenter.x, -originalCenter.y),
        )
        const related = db
          .toArray()
          .filter(
            (elm) =>
              "pcb_component_id" in elm && elm.pcb_component_id === memberId,
          )
        transformPCBElements(related as any, transformMatrix)
        updateCadRotation({
          db,
          pcbComponentId: memberId,
          rotationDegrees,
          layer: member.layer,
        })
      }
      continue
    }

    const pcbComponent = db.pcb_component.get(componentId)
    if (pcbComponent) {
      const currentGroupId = group.source_group_id
      const sourceComponent = db.source_component.get(
        pcbComponent.source_component_id,
      )
      const componentGroupId = sourceComponent?.source_group_id
      if (
        componentGroupId !== undefined &&
        !isDescendantGroup(db, componentGroupId, currentGroupId!)
      ) {
        continue
      }

      // If a manual placement positioned this component, skip the
      // pack transform — `pcb_component.center` is already at the
      // absolute manual position (set by
      // `_computePcbGlobalTransformBeforeLayout`), and the static
      // pack output's `center` is also in board-absolute coords, so
      // composing the group's transform on top would double-count
      // the group anchor (a cap manually placed at (11.4, 4.3) inside
      // `<group pcbX={16}>` would land at (27.4, 4.3)). The child
      // pcb primitives were already placed at the absolute position
      // during initial render — nothing to do here.
      const manualEdits = (group as any).getSubcircuit?.()?._parsedProps
        ?.manualEdits
      if (manualEdits?.pcb_placements && sourceComponent?.name) {
        const hit = manualEdits.pcb_placements.find(
          (p: any) => p.selector === sourceComponent.name,
        )
        if (hit) {
          db.pcb_component.update(componentId, { position_mode: "packed" })
          continue
        }
      }

      db.pcb_component.update(componentId, {
        position_mode: "packed",
      })

      const originalCenter = pcbComponent.center
      const rotationDegrees = ccwRotationDegrees ?? ccwRotationOffset ?? 0
      const transformMatrix = compose(
        group._computePcbGlobalTransformBeforeLayout(),
        translate(center.x, center.y),
        rotate((rotationDegrees * Math.PI) / 180),
        translate(-originalCenter.x, -originalCenter.y),
      )

      const related = db
        .toArray()
        .filter(
          (elm) =>
            "pcb_component_id" in elm && elm.pcb_component_id === componentId,
        )
      transformPCBElements(related as any, transformMatrix)
      updateCadRotation({
        db,
        pcbComponentId: componentId,
        rotationDegrees,
        layer: pcbComponent.layer,
      })
      continue
    }

    const pcbGroup = db.pcb_group
      .list()
      .find((g) => g.source_group_id === componentId)
    if (!pcbGroup) continue

    const originalCenter = pcbGroup.center
    const rotationDegrees = ccwRotationDegrees ?? ccwRotationOffset ?? 0
    const transformMatrix = compose(
      group._computePcbGlobalTransformBeforeLayout(),
      translate(center.x, center.y),
      rotate((rotationDegrees * Math.PI) / 180),
      translate(-originalCenter.x, -originalCenter.y),
    )

    const relatedElements = db.toArray().filter((elm) => {
      if ("source_group_id" in elm && elm.source_group_id) {
        if (elm.source_group_id === componentId) {
          return true
        }
        if (isDescendantGroup(db, elm.source_group_id, componentId)) {
          return true
        }
      }
      if ("source_component_id" in elm && elm.source_component_id) {
        const sourceComponent = db.source_component.get(elm.source_component_id)
        if (sourceComponent?.source_group_id) {
          if (sourceComponent.source_group_id === componentId) {
            return true
          }
          if (
            isDescendantGroup(db, sourceComponent.source_group_id, componentId)
          ) {
            return true
          }
        }
      }
      if ("pcb_component_id" in elm && elm.pcb_component_id) {
        const pcbComp = db.pcb_component.get(elm.pcb_component_id)
        if (pcbComp?.source_component_id) {
          const sourceComp = db.source_component.get(
            pcbComp.source_component_id,
          )
          if (sourceComp?.source_group_id) {
            if (sourceComp.source_group_id === componentId) {
              return true
            }
            if (
              isDescendantGroup(db, sourceComp.source_group_id, componentId)
            ) {
              return true
            }
          }
        }
      }
      return false
    })

    for (const elm of relatedElements) {
      if (elm.type === "pcb_component") {
        db.pcb_component.update(elm.pcb_component_id, {
          position_mode: "packed",
        })
      }
    }

    transformPCBElements(relatedElements as any, transformMatrix)
    db.pcb_group.update(pcbGroup.pcb_group_id, { center })
  }
}
