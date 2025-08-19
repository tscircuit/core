import type { Group } from "./Group"
import { buildSubtree } from "@tscircuit/circuit-json-util"
import {
  pack,
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
  getGraphicsFromPackOutput,
  type PackInput,
} from "calculate-packing"
import { length } from "circuit-json"
import {
  transformPCBElements,
  getPrimaryId,
} from "@tscircuit/circuit-json-util"
import { translate, rotate, compose } from "transformation-matrix"
import Debug from "debug"

const debug = Debug("Group_doInitialPcbLayoutPack")

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

  const gapMm = length.parse(gap ?? "0mm")
  const packInput: PackInput = {
    ...convertPackOutputToPackInput(
      convertCircuitJsonToPackOutput(db.toArray(), {
        source_group_id: group.source_group_id!,
      }),
    ),
    // @ts-expect-error we're missing some pack order strategies
    orderStrategy: packOrderStrategy ?? "largest_to_smallest",
    placementStrategy:
      packPlacementStrategy ?? "minimum_sum_squared_distance_to_network",
    minGap: gapMm,
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
        componentGroupId !== currentGroupId
      ) {
        // Check if it's a descendant group (child, grandchild, etc.)
        const isDescendant = (groupId: string, ancestorId: string): boolean => {
          const group = db.source_group.get(groupId)
          if (!group || !group.parent_source_group_id) return false
          if (group.parent_source_group_id === ancestorId) return true
          return isDescendant(group.parent_source_group_id, ancestorId)
        }

        if (!isDescendant(componentGroupId, currentGroupId!)) {
          continue
        }
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

    // Get all elements related to this group
    const allSubtreeElements = buildSubtree(db.toArray(), {
      source_group_id: componentId,
    })

    // Filter out elements that belong to sibling groups to prevent cross-group interference
    // but keep elements that don't have source_group_id (PCB primitives) and descendant group elements
    const filteredSubtree = allSubtreeElements.filter((elm) => {
      // Check elements without source_group_id more carefully
      if (!("source_group_id" in elm) || !elm.source_group_id) {
        // Check if this element belongs to a component in a different group
        if ("source_component_id" in elm && elm.source_component_id) {
          const sourceComponent = db.source_component.get(
            elm.source_component_id,
          )
          if (
            sourceComponent &&
            sourceComponent.source_group_id &&
            sourceComponent.source_group_id !== componentId
          ) {
            return false // Exclude elements from components in different groups
          }
        }
        return true // Include elements without clear group association
      }

      // Always include elements from the target group itself
      if (elm.source_group_id === componentId) {
        return true
      }

      // For elements with source_group_id, check if it's a descendant of the target group
      // This allows nested group scenarios to work correctly
      const isDescendantOfTarget = (
        groupId: string,
        targetId: string,
      ): boolean => {
        if (groupId === targetId) return true
        const group = db.source_group.get(groupId)
        if (!group || !group.parent_source_group_id) return false
        return isDescendantOfTarget(group.parent_source_group_id, targetId)
      }

      // Include if it's a descendant of the target group
      if (isDescendantOfTarget(elm.source_group_id, componentId)) {
        return true
      }

      // Exclude elements from sibling groups (this prevents the cross-group interference)
      return false
    })

    transformPCBElements(filteredSubtree as any, transformMatrix)
    db.pcb_group.update(pcbGroup.pcb_group_id, { center })
  }
}
