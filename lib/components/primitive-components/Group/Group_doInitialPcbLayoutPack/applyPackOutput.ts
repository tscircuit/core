import {
  type CircuitJsonUtilObjects,
  findBoundsAndCenter,
  transformPCBElements,
} from "@tscircuit/circuit-json-util"
import { normalizeDegrees } from "@tscircuit/math-utils"
import type { PackOutput } from "calculate-packing"
import {
  type Matrix,
  applyToPoint,
  compose,
  decomposeTSR,
  rotate,
  translate,
} from "transformation-matrix"
import type { Group } from "../Group"
import type { ClusterInfo } from "./applyComponentConstraintClusters"

const transformPackPcbElements = (elements: any[], transformMatrix: Matrix) => {
  const rotationRadians = decomposeTSR(transformMatrix).rotation.angle
  const rotationDegrees = (rotationRadians * 180) / Math.PI
  const normalizedDelta = normalizeDegrees(rotationDegrees)

  const snapshots = new Map<
    any,
    {
      shape?: string
      ccw_rotation?: number
      rect_ccw_rotation?: number
      hole_ccw_rotation?: number
      hole_offset_x?: number
      hole_offset_y?: number
      pad_outline?: Array<{ x: number; y: number }>
    }
  >()

  if (normalizedDelta !== 0) {
    for (const elm of elements) {
      if (elm.type === "pcb_plated_hole" || elm.type === "pcb_solder_paste") {
        snapshots.set(elm, {
          shape: elm.shape,
          ccw_rotation: elm.ccw_rotation,
          rect_ccw_rotation: elm.rect_ccw_rotation,
          hole_ccw_rotation: elm.hole_ccw_rotation,
          hole_offset_x: elm.hole_offset_x,
          hole_offset_y: elm.hole_offset_y,
          pad_outline: Array.isArray(elm.pad_outline)
            ? elm.pad_outline.map((pt: { x: number; y: number }) => ({
                x: pt.x,
                y: pt.y,
              }))
            : undefined,
        })
      }
    }
  }

  transformPCBElements(elements as any, transformMatrix)

  if (normalizedDelta === 0) return

  const originRotationMatrix = rotate(rotationRadians)

  for (const elm of elements) {
    const prev = snapshots.get(elm)
    if (!prev) continue

    if (elm.type === "pcb_plated_hole") {
      if (elm.shape === "pill" || elm.shape === "oval") {
        if (elm.ccw_rotation === prev.ccw_rotation) {
          elm.ccw_rotation = normalizeDegrees(
            (prev.ccw_rotation ?? 0) + rotationDegrees,
          )
        }
      } else if (elm.shape === "circular_hole_with_rect_pad") {
        if (elm.rect_ccw_rotation === prev.rect_ccw_rotation) {
          elm.rect_ccw_rotation = normalizeDegrees(
            (prev.rect_ccw_rotation ?? 0) + rotationDegrees,
          )
        }
      } else if (elm.shape === "rotated_pill_hole_with_rect_pad") {
        if (elm.hole_ccw_rotation === prev.hole_ccw_rotation) {
          elm.hole_ccw_rotation = normalizeDegrees(
            (prev.hole_ccw_rotation ?? 0) + rotationDegrees,
          )
        }
        if (elm.rect_ccw_rotation === prev.rect_ccw_rotation) {
          elm.rect_ccw_rotation = normalizeDegrees(
            (prev.rect_ccw_rotation ?? 0) + rotationDegrees,
          )
        }
      } else if (elm.shape === "pill_hole_with_rect_pad") {
        elm.shape = "rotated_pill_hole_with_rect_pad"
        elm.hole_shape = "rotated_pill"
        elm.pad_shape = "rect"
        elm.hole_ccw_rotation = normalizedDelta
        elm.rect_ccw_rotation = normalizedDelta
      }

      if (
        (typeof prev.hole_offset_x === "number" ||
          typeof prev.hole_offset_y === "number") &&
        elm.hole_offset_x === prev.hole_offset_x &&
        elm.hole_offset_y === prev.hole_offset_y &&
        ((prev.hole_offset_x ?? 0) !== 0 || (prev.hole_offset_y ?? 0) !== 0)
      ) {
        const rotatedOffset = applyToPoint(originRotationMatrix, {
          x: prev.hole_offset_x ?? 0,
          y: prev.hole_offset_y ?? 0,
        })
        elm.hole_offset_x = rotatedOffset.x
        elm.hole_offset_y = rotatedOffset.y
      }

      if (
        elm.shape === "hole_with_polygon_pad" &&
        prev.pad_outline &&
        Array.isArray(elm.pad_outline) &&
        elm.pad_outline.length === prev.pad_outline.length &&
        elm.pad_outline.every(
          (pt: { x: number; y: number }, i: number) =>
            pt.x === prev.pad_outline![i].x && pt.y === prev.pad_outline![i].y,
        )
      ) {
        elm.pad_outline = prev.pad_outline.map((pt) =>
          applyToPoint(originRotationMatrix, pt),
        )
      }
    } else if (
      elm.type === "pcb_solder_paste" &&
      elm.shape === "rotated_pill"
    ) {
      if (elm.ccw_rotation === prev.ccw_rotation) {
        elm.ccw_rotation = normalizeDegrees(
          (prev.ccw_rotation ?? 0) + rotationDegrees,
        )
      }
    }
  }
}

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
        transformPackPcbElements(related as any, transformMatrix)
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
      transformPackPcbElements(related as any, transformMatrix)
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

    transformPackPcbElements(relatedElements as any, transformMatrix)
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
