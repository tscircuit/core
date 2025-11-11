import type { Group } from "../Group"
import {
  pack,
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
  getGraphicsFromPackOutput,
  type PackInput,
} from "calculate-packing"
import {
  type AnyCircuitElement,
  type PcbSmtPad,
  type PcbPlatedHole,
  type PcbComponent,
  length,
} from "circuit-json"
import Debug from "debug"
import { applyComponentConstraintClusters } from "./applyComponentConstraintClusters"
import { applyPackOutput } from "./applyPackOutput"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import {
  getObstacleDimensionsFromSmtPad,
  getObstacleDimensionsFromPlatedHole,
} from "lib/utils/packing/getObstacleDimensionsFromElement"

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

  // Collect pcb_component_ids that should be excluded from packing
  // Only collect from DIRECT children, not all descendants
  const excludedPcbComponentIds = new Set<string>()

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
        excludedPcbComponentIds.add(
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

  // Filter out relatively positioned components and groups from the circuit JSON
  const filteredCircuitJson = db
    .toArray()
    .filter((element: AnyCircuitElement) => {
      if (element.type === "pcb_component") {
        return !excludedPcbComponentIds.has(element.pcb_component_id)
      }
      if (element.type === "pcb_group") {
        return !excludedPcbGroupIds.has(element.pcb_group_id)
      }
      return true
    })

  // Collect pads and holes from relatively positioned components to use as obstacles
  const obstaclesFromRelativelyPositionedComponents: Array<{
    obstacleId: string
    absoluteCenter: { x: number; y: number }
    width: number
    height: number
  }> = []

  for (const pcb_component_id of excludedPcbComponentIds) {
    const component = db
      .toArray()
      .find(
        (el): el is PcbComponent =>
          el.type === "pcb_component" &&
          el.pcb_component_id === pcb_component_id,
      )
    if (!component) continue

    const componentX = component.center.x
    const componentY = component.center.y

    // Collect SMT pads
    const smtpads = db
      .toArray()
      .filter(
        (el): el is PcbSmtPad =>
          el.type === "pcb_smtpad" && el.pcb_component_id === pcb_component_id,
      )

    for (const pad of smtpads) {
      const dimensions = getObstacleDimensionsFromSmtPad(pad)
      if (!dimensions || dimensions.width === 0 || dimensions.height === 0) {
        continue
      }

      // Polygon pads don't have x/y, they have points
      let centerX: number
      let centerY: number
      if (pad.shape === "polygon") {
        // For polygons, calculate center from bounding box
        const xs = pad.points.map((p) => p.x)
        const ys = pad.points.map((p) => p.y)
        centerX = componentX + (Math.min(...xs) + Math.max(...xs)) / 2
        centerY = componentY + (Math.min(...ys) + Math.max(...ys)) / 2
      } else {
        centerX = componentX + pad.x
        centerY = componentY + pad.y
      }

      obstaclesFromRelativelyPositionedComponents.push({
        obstacleId: pad.pcb_smtpad_id,
        absoluteCenter: { x: centerX, y: centerY },
        width: dimensions.width,
        height: dimensions.height,
      })
    }

    // Collect plated holes
    const platedHoles = db
      .toArray()
      .filter(
        (el): el is PcbPlatedHole =>
          el.type === "pcb_plated_hole" &&
          el.pcb_component_id === pcb_component_id,
      )

    for (const hole of platedHoles) {
      const dimensions = getObstacleDimensionsFromPlatedHole(hole)
      if (!dimensions || dimensions.width === 0 || dimensions.height === 0) {
        continue
      }

      const centerX = componentX + hole.x
      const centerY = componentY + hole.y

      obstaclesFromRelativelyPositionedComponents.push({
        obstacleId: hole.pcb_plated_hole_id,
        absoluteCenter: { x: centerX, y: centerY },
        width: dimensions.width,
        height: dimensions.height,
      })
    }
  }

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
        shouldAddInnerObstacles: true,
        chipMarginsMap,
      }),
    ),
    // @ts-expect-error we're missing some pack order strategies
    orderStrategy: packOrderStrategy ?? "largest_to_smallest",
    placementStrategy:
      packPlacementStrategy ?? "minimum_sum_squared_distance_to_network",
    minGap: gapMm,
    obstacles: obstaclesFromRelativelyPositionedComponents,
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

  if (debug.enabled && global.debugGraphics) {
    const graphics = getGraphicsFromPackOutput(packOutput)
    graphics.title = `packOutput-${group.name}`
    global.debugGraphics?.push(graphics)
  }

  applyPackOutput(group, packOutput, clusterMap)
}
