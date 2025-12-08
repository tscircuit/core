import type { Group } from "../Group"
import {
  pack,
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
  getGraphicsFromPackOutput,
  type PackInput,
} from "calculate-packing"
import { type PcbComponent, length } from "circuit-json"
import Debug from "debug"
import { applyComponentConstraintClusters } from "./applyComponentConstraintClusters"
import { applyPackOutput } from "./applyPackOutput"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"

const DEFAULT_MIN_GAP = "1mm"
const debug = Debug("Group_doInitialPcbLayoutPack")

export const Group_doInitialPcbLayoutPack = (group: Group) => {
  const { db } = group.root!
  const { _parsedProps: props } = group

  const {
    packOrderStrategy,
    packPlacementStrategy,
    gap: gapProp,
    pcbGap,
    pcbPackGap,
  } = props

  const gap = pcbPackGap ?? pcbGap ?? gapProp
  const gapMm = length.parse(gap ?? DEFAULT_MIN_GAP)

  const chipMarginsMap: Record<
    string,
    { left: number; right: number; top: number; bottom: number }
  > = {}

  // Collect pcb_component_ids that should be treated as static by the packer
  // Only collect from DIRECT children, not all descendants
  const staticPcbComponentIds = new Set<string>()

  // Recursively collect margins from all descendants
  const collectMargins = (comp: any) => {
    if (comp?.pcb_component_id && comp?._parsedProps) {
      const props = comp._parsedProps
      const left = length.parse(props.pcbMarginLeft ?? props.pcbMarginX ?? 0)
      const right = length.parse(props.pcbMarginRight ?? props.pcbMarginX ?? 0)
      const top = length.parse(props.pcbMarginTop ?? props.pcbMarginY ?? 0)
      const bottom = length.parse(
        props.pcbMarginBottom ?? props.pcbMarginY ?? 0,
      )
      if (left || right || top || bottom) {
        chipMarginsMap[comp.pcb_component_id] = { left, right, top, bottom }
      }
    }
    if (comp?.children) comp.children.forEach(collectMargins)
  }

  collectMargins(group)

  const excludedPcbGroupIds = new Set<string>()
  for (const child of group.children) {
    const childIsGroupOrNormalComponent = child as NormalComponent
    if (
      childIsGroupOrNormalComponent._isNormalComponent &&
      childIsGroupOrNormalComponent.isRelativelyPositioned?.()
    ) {
      if (childIsGroupOrNormalComponent.pcb_component_id) {
        staticPcbComponentIds.add(
          childIsGroupOrNormalComponent.pcb_component_id,
        )
      }
      if ((childIsGroupOrNormalComponent as Group).pcb_group_id) {
        excludedPcbGroupIds.add(
          (childIsGroupOrNormalComponent as Group).pcb_group_id!,
        )
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

  // Mark all components belonging to relatively positioned groups as static
  if (excludedPcbGroupIds.size > 0) {
    for (const element of db.toArray()) {
      if (element.type !== "pcb_component") continue
      const sourceComponent = db.source_component.get(
        (element as PcbComponent).source_component_id,
      )
      if (!sourceComponent?.source_group_id) continue
      for (const groupId of excludedPcbGroupIds) {
        if (isDescendantGroup(db, sourceComponent.source_group_id, groupId)) {
          staticPcbComponentIds.add(element.pcb_component_id)
        }
      }
    }
  }

  // Keep all circuit elements; static components will remain fixed during packing
  const filteredCircuitJson = db.toArray()

  // Calculate bounds if width and height are specified
  let bounds:
    | { minX: number; minY: number; maxX: number; maxY: number }
    | undefined
  if (props.width !== undefined && props.height !== undefined) {
    const widthMm = length.parse(props.width)
    const heightMm = length.parse(props.height)

    // Bounds should be in local packing space (centered at 0,0)
    // The group's global position will be applied later by applyPackOutput
    bounds = {
      minX: -widthMm / 2,
      maxX: widthMm / 2,
      minY: -heightMm / 2,
      maxY: heightMm / 2,
    }
  }

  const packInput: PackInput = {
    ...convertPackOutputToPackInput(
      convertCircuitJsonToPackOutput(filteredCircuitJson, {
        source_group_id: group.source_group_id!,
        // shouldAddInnerObstacles: true,
        chipMarginsMap,
        staticPcbComponentIds: Array.from(staticPcbComponentIds),
      }),
    ),
    // @ts-expect-error we're missing some pack order strategies
    orderStrategy: packOrderStrategy ?? "largest_to_smallest",
    placementStrategy:
      packPlacementStrategy ?? "minimum_sum_squared_distance_to_network",
    minGap: gapMm,
    bounds,
  }

  const clusterMap = applyComponentConstraintClusters(group, packInput)

  if (debug.enabled) {
    group.root?.emit("debug:logOutput", {
      type: "debug:logOutput",
      name: `packInput-circuitjson-${group.name}`,
      content: JSON.stringify(db.toArray()),
    })
    group.root?.emit("debug:logOutput", {
      type: "debug:logOutput",
      name: `packInput-${group.name}`,
      content: packInput,
    })
  }

  const packOutput = pack(packInput)

  if (debug.enabled && global?.debugGraphics) {
    const graphics = getGraphicsFromPackOutput(packOutput)
    graphics.title = `packOutput-${group.name}`
    global.debugGraphics?.push(graphics)
  }

  applyPackOutput(group, packOutput, clusterMap)
}
