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
        // Check if it's a child group
        const componentSourceGroup = db.source_group.get(componentGroupId)
        if (
          !componentSourceGroup ||
          componentSourceGroup.parent_source_group_id !== currentGroupId
        ) {
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

    // Use manual filtering instead of buildSubtree to prevent cross-group interference
    // buildSubtree was including elements from sibling groups, causing rotation/positioning issues
    const filteredElements = db.toArray().filter((elm) => {
      if (!("source_group_id" in elm) || !elm.source_group_id) return false

      // Only include elements from the target group or its descendants
      if (elm.source_group_id === componentId) return true

      // Check if it's a child of the target group
      const sourceGroup = db.source_group.get(elm.source_group_id)
      if (sourceGroup && sourceGroup.parent_source_group_id === componentId)
        return true

      return false
    })

    transformPCBElements(filteredElements as any, transformMatrix)
    db.pcb_group.update(pcbGroup.pcb_group_id, { center })
  }
}
