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
import { transformPCBElements } from "@tscircuit/circuit-json-util"
import { translate, rotate, compose } from "transformation-matrix"
import Debug from "debug"

const DEFAULT_MIN_GAP = "1mm"
const debug = Debug("Group_doInitialPcbLayoutPack")

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
      }),
    ),
    // @ts-expect-error we're missing some pack order strategies
    orderStrategy: packOrderStrategy ?? "largest_to_smallest",
    placementStrategy:
      packPlacementStrategy ?? "minimum_sum_squared_distance_to_network",
    minGap: gapMm,
  }
  // Augment pack input with fake center pads
  addFakeCenterPadsToPackInput(packInput, db)
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

// Add a synthetic center pad to each component in the PackInput to prevent
// components with sparse pads (e.g., 0402 resistors) from interleaving through
// the body center of other parts during packing.
function addFakeCenterPadsToPackInput(packInput: PackInput, db: any): void {
  for (const comp of (packInput as any).components ?? []) {
    // Derive a reasonable center pad size from the component or group body size
    let widthMm: number | undefined
    let heightMm: number | undefined

    const pcbComp = db.pcb_component.get?.(comp.componentId)
    if (pcbComp) {
      widthMm =
        typeof pcbComp.width === "string"
          ? length.parse(pcbComp.width)
          : pcbComp.width
      heightMm =
        typeof pcbComp.height === "string"
          ? length.parse(pcbComp.height)
          : pcbComp.height
    } else {
      // If this pack component corresponds to a pcb_group, use that size
      const pcbGroup = db.pcb_group
        ?.list?.()
        ?.find?.((g: any) => g.source_group_id === comp.componentId)
      if (pcbGroup) {
        widthMm =
          typeof pcbGroup.width === "string"
            ? length.parse(pcbGroup.width)
            : pcbGroup.width
        heightMm =
          typeof pcbGroup.height === "string"
            ? length.parse(pcbGroup.height)
            : pcbGroup.height
      }
    }

    const minDim = Math.max(0, Math.min(widthMm ?? 0, heightMm ?? 0))
    // Choose a conservative center pad size: half of the smaller dimension,
    // clamped to a sensible range to avoid over-inflating clearances.
    const HALF_COMPONENT_SIZE_FACTOR = 0.5
    const MIN_CENTER_PAD_SIZE_MM = 0.4
    const DEFAULT_CENTER_PAD_SIZE_MM = 0.6

    const sideLengthInMm =
      minDim > 0
        ? Math.min(
            Math.max(
              minDim * HALF_COMPONENT_SIZE_FACTOR,
              MIN_CENTER_PAD_SIZE_MM,
            ),
            minDim,
          )
        : DEFAULT_CENTER_PAD_SIZE_MM

    // Append a synthetic center pad
    comp.pads = [
      ...(comp.pads ?? []),
      {
        padId: `${comp.componentId}__center`,
        networkId: `${comp.componentId}__body`, // unique per component, no cross-attraction
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: sideLengthInMm, y: sideLengthInMm },
      },
    ]
  }
}
