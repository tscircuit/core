import type { Group } from "../Group"
import {
  PackSolver2,
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
  getGraphicsFromPackOutput,
  type PackInput,
  type PackOutput,
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

  // Emit packing:start event
  group.root?.emit("packing:start", {
    subcircuit_id: group.subcircuit_id,
    componentDisplayName: group.getString(),
  })

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

  // Calculate bounds if width and height are specified.
  // If the group itself doesn't have them, walk up to the nearest
  // ancestor that does (typically the board) and shrink/translate
  // that ancestor's bounds to this group's local packing frame.
  // Without this fallback, packers on inner groups have no bounds
  // and pack components in an unbounded column off the board —
  // see tscircuit/core#2272.
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
  } else {
    // Inherit from nearest ancestor with width/height. Walk parents,
    // accumulating each step's pcbX/pcbY so the resulting bounds end
    // up in THIS group's local packing frame (centered at 0,0).
    let cumulativeOffsetX = 0
    let cumulativeOffsetY = 0
    let ancestor: any = group.parent
    while (ancestor) {
      const apProps = ancestor._parsedProps
      if (typeof apProps?.pcbX === "number") cumulativeOffsetX += apProps.pcbX
      if (typeof apProps?.pcbY === "number") cumulativeOffsetY += apProps.pcbY
      if (apProps?.width !== undefined && apProps?.height !== undefined) {
        const widthMm = length.parse(apProps.width)
        const heightMm = length.parse(apProps.height)
        // Ancestor bounds in ITS local frame, centered at (0, 0) of ancestor.
        // To express in THIS group's local frame: subtract the chain of
        // pcb offsets (the group's center in ancestor coords, summed
        // through any intermediate offsets we passed through).
        // Note: the group's OWN pcbX/pcbY is the offset from its parent;
        // by walking up from group.parent we already start one level
        // above the group, so we need to subtract the group's own
        // offset too.
        const groupOwnX = typeof props.pcbX === "number" ? props.pcbX : 0
        const groupOwnY = typeof props.pcbY === "number" ? props.pcbY : 0
        const totalOffsetX = cumulativeOffsetX + groupOwnX
        const totalOffsetY = cumulativeOffsetY + groupOwnY
        bounds = {
          minX: -widthMm / 2 - totalOffsetX,
          maxX: widthMm / 2 - totalOffsetX,
          minY: -heightMm / 2 - totalOffsetY,
          maxY: heightMm / 2 - totalOffsetY,
        }
        break
      }
      ancestor = ancestor.parent
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

  let packOutput: PackOutput
  try {
    const solver = new PackSolver2(packInput)
    group.root?.emit("solver:started", {
      type: "solver:started",
      solverName: "PackSolver2",
      solverParams: solver.getConstructorParams(),
      componentName: group.getString(),
    })

    solver.solve()

    packOutput = {
      ...packInput,
      components: solver.packedComponents,
    }
  } catch (error) {
    group.root?.emit("packing:error", {
      subcircuit_id: group.subcircuit_id,
      componentDisplayName: group.getString(),
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    })
    throw error
  }

  if (debug.enabled && global?.debugGraphics) {
    const graphics = getGraphicsFromPackOutput(packOutput)
    graphics.title = `packOutput-${group.name}`
    global.debugGraphics?.push(graphics)
  }

  applyPackOutput(group, packOutput, clusterMap)

  // Emit packing:end event
  group.root?.emit("packing:end", {
    subcircuit_id: group.subcircuit_id,
    componentDisplayName: group.getString(),
  })
}
