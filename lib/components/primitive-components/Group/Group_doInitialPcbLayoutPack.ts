import { buildSubtree } from "@tscircuit/circuit-json-util"
import {
  getPrimaryId,
  transformPCBElements,
} from "@tscircuit/circuit-json-util"
import {
  type PackInput,
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
  getGraphicsFromPackOutput,
  pack,
} from "calculate-packing"
import { length } from "circuit-json"
import Debug from "debug"
import { compose, rotate, translate } from "transformation-matrix"
import type { Group } from "./Group"

const DEFAULT_MIN_GAP = "1mm"
const debug = Debug("Group_doInitialPcbLayoutPack")
const norm = (deg: number) => ((deg % 360) + 360) % 360

// Helper function to check if a group is a descendant of another group
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

export const Group_doInitialPcbLayoutPack = (group: Group) => {
  const { db } = group.root!
  const { _parsedProps: props } = group

  const {
    packOrderStrategy,
    packPlacementStrategy,
    gap: gapProp,
    pcbGap,
    // @ts-expect-error remove when props introduces pcbPackGap
    pcbPackGap,
  } = props

  const gap = pcbPackGap ?? pcbGap ?? gapProp

  const gapMm = length.parse(gap ?? DEFAULT_MIN_GAP)
  const packInput: PackInput = {
    ...convertPackOutputToPackInput(
      convertCircuitJsonToPackOutput(db.toArray(), {
        source_group_id: group.source_group_id!,
        shouldAddInnerObstacles: true,
      }),
    ),
    // @ts-expect-error we're missing some pack order strategies
    orderStrategy: packOrderStrategy ?? "largest_to_smallest",
    placementStrategy:
      packPlacementStrategy ?? "minimum_sum_squared_distance_to_network",
    minGap: gapMm,
  }

  if (debug.enabled) {
    global.debugOutputs?.add(
      `packInput-circuitjson-${group.name}`,
      JSON.stringify(db.toArray()),
    )
    global.debugOutputs?.add(`packInput-${group.name}`, packInput)
  }

  const packOutput = pack(packInput)

  if (debug.enabled) {
    const graphics = getGraphicsFromPackOutput(packOutput)
    graphics.title = `packOutput-${group.name}`
    global.debugGraphics?.push(graphics)
  }

  // Apply the pack output to the circuit json
  for (const packedComponent of packOutput.components) {
    const { center, componentId, ccwRotationOffset, ccwRotationDegrees } =
      packedComponent

    const pcbComponent = db.pcb_component.get(componentId)
    if (pcbComponent) {
      // Only transform components that belong to the current group or its children
      // to prevent cross-group interference
      const currentGroupId = group.source_group_id

      // Get the source component to find its group association
      const sourceComponent = db.source_component.get(
        pcbComponent.source_component_id,
      )
      const componentGroupId = sourceComponent?.source_group_id

      // Skip if component doesn't belong to current group or its descendants
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
      const groupRot = group._parsedProps?.pcbRotation ?? 0
      const packedRot = ccwRotationDegrees ?? ccwRotationOffset ?? 0
      const existingRot = pcbComponent.rotation ?? 0
      const finalRot =
        (((groupRot + packedRot + existingRot) % 360) + 360) % 360

      db.pcb_component.update(componentId, {
        rotation: finalRot,
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

    // Only transform elements that belong to this specific group or its descendants
    // This prevents cross-group interference while allowing nested group functionality
    const relatedElements = db.toArray().filter((elm) => {
      // Check if element belongs to the current group or any of its descendant groups
      if ("source_group_id" in elm && elm.source_group_id) {
        // Include if element belongs to the specific group being processed
        if (elm.source_group_id === componentId) {
          return true
        }

        // Include if element belongs to a descendant group
        if (isDescendantGroup(db, elm.source_group_id, componentId)) {
          return true
        }
      }

      // Check elements that belong to components
      if ("source_component_id" in elm && elm.source_component_id) {
        const sourceComponent = db.source_component.get(elm.source_component_id)
        if (sourceComponent?.source_group_id) {
          // Include if component belongs to the specific group being processed
          if (sourceComponent.source_group_id === componentId) {
            return true
          }

          // Include if component belongs to a descendant group
          if (
            isDescendantGroup(db, sourceComponent.source_group_id, componentId)
          ) {
            return true
          }
        }
      }

      // Check pcb elements that reference components
      if ("pcb_component_id" in elm && elm.pcb_component_id) {
        const pcbComponent = db.pcb_component.get(elm.pcb_component_id)
        if (pcbComponent?.source_component_id) {
          const sourceComponent = db.source_component.get(
            pcbComponent.source_component_id,
          )
          if (sourceComponent?.source_group_id) {
            // Include if component belongs to the specific group being processed
            if (sourceComponent.source_group_id === componentId) {
              return true
            }

            // Include if component belongs to a descendant group
            if (
              isDescendantGroup(
                db,
                sourceComponent.source_group_id,
                componentId,
              )
            ) {
              return true
            }
          }
        }
      }

      return false
    })

    transformPCBElements(relatedElements as any, transformMatrix)
    db.pcb_group.update(pcbGroup.pcb_group_id, { center })
  }
}
