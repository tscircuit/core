import {
  type CircuitJsonUtilObjects,
  findBoundsAndCenter,
  transformPCBElements,
} from "@tscircuit/circuit-json-util"
import { normalizeDegrees } from "@tscircuit/math-utils"
import type { PackOutput } from "calculate-packing"
import { compose, rotate, translate } from "transformation-matrix"
import type { Group } from "../Group"
import type { ClusterInfo } from "./applyComponentConstraintClusters"

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

const updatePcbPlatedHoleRotation = ({
  db,
  pcbComponentId,
  rotationDegrees,
}: {
  db: CircuitJsonUtilObjects
  pcbComponentId: string
  rotationDegrees: number
}) => {
  if (!rotationDegrees) return
  if (!db?.pcb_plated_hole?.list) return

  const relatedHoles = db.pcb_plated_hole.list({
    pcb_component_id: pcbComponentId,
  })

  const rad = (rotationDegrees * Math.PI) / 180

  for (const hole of relatedHoles) {
    const updates: Record<string, any> = {}

    if (
      typeof (hole as any).hole_offset_x === "number" ||
      typeof (hole as any).hole_offset_y === "number"
    ) {
      const ox = (hole as any).hole_offset_x ?? 0
      const oy = (hole as any).hole_offset_y ?? 0
      updates.hole_offset_x = ox * Math.cos(rad) - oy * Math.sin(rad)
      updates.hole_offset_y = ox * Math.sin(rad) + oy * Math.cos(rad)
    }

    if (hole.shape === "pill" || hole.shape === "oval") {
      const currentRot = (hole as any).ccw_rotation ?? 0
      updates.ccw_rotation = normalizeDegrees(currentRot + rotationDegrees)
    } else if (hole.shape === "circular_hole_with_rect_pad") {
      const currentRot = (hole as any).rect_ccw_rotation ?? 0
      updates.rect_ccw_rotation = normalizeDegrees(currentRot + rotationDegrees)
    } else if (hole.shape === "rotated_pill_hole_with_rect_pad") {
      const currentHoleRot = (hole as any).hole_ccw_rotation ?? 0
      const currentRectRot = (hole as any).rect_ccw_rotation ?? 0
      updates.hole_ccw_rotation = normalizeDegrees(
        currentHoleRot + rotationDegrees,
      )
      updates.rect_ccw_rotation = normalizeDegrees(
        currentRectRot + rotationDegrees,
      )
    } else if (hole.shape === "pill_hole_with_rect_pad") {
      updates.shape = "rotated_pill_hole_with_rect_pad"
      updates.hole_shape = "rotated_pill"
      updates.pad_shape = "rect"
      updates.hole_ccw_rotation = normalizeDegrees(rotationDegrees)
      updates.rect_ccw_rotation = normalizeDegrees(rotationDegrees)
    } else if (hole.shape === "hole_with_polygon_pad") {
      if (typeof (hole as any).ccw_rotation === "number") {
        updates.ccw_rotation = normalizeDegrees(
          (hole as any).ccw_rotation + rotationDegrees,
        )
      }
    }

    if (Object.keys(updates).length > 0) {
      db.pcb_plated_hole.update(hole.pcb_plated_hole_id, updates as any)
      Object.assign(hole, updates)
    }
  }

  if (db?.pcb_solder_paste?.list) {
    const relatedPastes = db.pcb_solder_paste.list({
      pcb_component_id: pcbComponentId,
    })
    for (const paste of relatedPastes) {
      if (typeof (paste as any).ccw_rotation === "number") {
        const nextRot = normalizeDegrees(
          (paste as any).ccw_rotation + rotationDegrees,
        )
        db.pcb_solder_paste.update(paste.pcb_solder_paste_id, {
          ccw_rotation: nextRot,
        })
        ;(paste as any).ccw_rotation = nextRot
      }
    }
  }
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
  initialPackOutput: PackOutput,
) => {
  const { db } = group.root!

  for (const packedComponent of packOutput.components) {
    // Static components participate in collision and network scoring, but their
    // authored position must remain untouched by the packing output.
    if (packedComponent.isStatic) continue

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
        updatePcbPlatedHoleRotation({
          db,
          pcbComponentId: memberId,
          rotationDegrees,
        })
      }
      continue
    }

    const pcbComponent = db.pcb_component.get(componentId)
    if (pcbComponent) {
      db.pcb_component.update(componentId, {
        position_mode: "packed",
      })
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
      updatePcbPlatedHoleRotation({
        db,
        pcbComponentId: componentId,
        rotationDegrees,
      })
      continue
    }

    const pcbGroup = db.pcb_group
      .list()
      .find((g) => g.source_group_id === componentId)
    if (!pcbGroup) continue

    const initialPackedComponent = initialPackOutput.components.find(
      (component) => component.componentId === componentId,
    )
    // The converter's aggregate center is the origin used for descendant
    // offsets. pcb_group.center can still contain its pre-layout default.
    const originalCenter = initialPackedComponent?.center ?? pcbGroup.center
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
    if (rotationDegrees !== 0) {
      for (const elm of relatedElements) {
        if (elm.type === "pcb_component") {
          updatePcbPlatedHoleRotation({
            db,
            pcbComponentId: elm.pcb_component_id,
            rotationDegrees,
          })
        }
      }
    }
    db.pcb_group.update(pcbGroup.pcb_group_id, { center })
  }

  // Packing transforms Circuit JSON, so derive the group bounds from the
  // transformed PCB components instead of their authored positions.
  if (group.pcb_group_id) {
    const groupPcbComponents = db.pcb_component.list({
      pcb_group_id: group.pcb_group_id,
    })
    group.calculatePcbGroupBounds(findBoundsAndCenter(groupPcbComponents))
  }
}
