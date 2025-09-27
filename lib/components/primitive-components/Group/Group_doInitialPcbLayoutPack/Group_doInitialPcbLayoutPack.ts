import type { Group } from "../Group"
import {
  pack,
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
  getGraphicsFromPackOutput,
  type PackInput,
} from "calculate-packing"
import { length } from "circuit-json"
import Debug from "debug"
import { applyComponentConstraintClusters } from "./applyComponentConstraintClusters"
import { applyPackOutput } from "./applyPackOutput"

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
    // @ts-expect-error remove when props introduces pcbPackGap
    pcbPackGap,
  } = props

  const children = group.children

  // My children can either be components or groups
  // - Some components (from parent groups) are already placed because they
  // have relative positions, so their position is known pre-layout
  //    - Even though their position is known pre-layout, it is maybe only known
  //      relative to the group
  // - they can also have constraints that cluster them together
  // When we're creating the pack input, we want to map the pack input
  // chips to clusters

  // const gap = pcbPackGap ?? pcbGap ?? gapProp
  // const gapMm = length.parse(gap ?? DEFAULT_MIN_GAP)

  // const chipMarginsMap: Record<
  //   string,
  //   { left: number; right: number; top: number; bottom: number }
  // > = {}

  // const collectMargins = (comp: any) => {
  //   if (comp?.pcb_component_id && comp?._parsedProps) {
  //     const props = comp._parsedProps
  //     const left = length.parse(props.pcbMarginLeft ?? props.pcbMarginX ?? 0)
  //     const right = length.parse(props.pcbMarginRight ?? props.pcbMarginX ?? 0)
  //     const top = length.parse(props.pcbMarginTop ?? props.pcbMarginY ?? 0)
  //     const bottom = length.parse(
  //       props.pcbMarginBottom ?? props.pcbMarginY ?? 0,
  //     )
  //     if (left || right || top || bottom) {
  //       chipMarginsMap[comp.pcb_component_id] = { left, right, top, bottom }
  //     }
  //   }
  //   if (comp?.children) comp.children.forEach(collectMargins)
  // }

  // collectMargins(group)
  // const packInput: PackInput = {
  //   ...convertPackOutputToPackInput(
  //     convertCircuitJsonToPackOutput(db.toArray(), {
  //       source_group_id: group.source_group_id!,
  //       shouldAddInnerObstacles: true,
  //       chipMarginsMap,
  //     }),
  //   ),
  //   // @ts-expect-error we're missing some pack order strategies
  //   orderStrategy: packOrderStrategy ?? "largest_to_smallest",
  //   placementStrategy:
  //     packPlacementStrategy ?? "minimum_sum_squared_distance_to_network",
  //   minGap: gapMm,
  // }

  // const clusterMap = applyComponentConstraintClusters(group, packInput)

  if (debug.enabled) {
    group.root?.emit("debug:logOutput", {
      type: "debug:logOutput",
      name: `packInput-${group.name}`,
      content: packInput,
    })
  }

  const packOutput = pack(packInput)

  if (debug.enabled) {
    const graphics = getGraphicsFromPackOutput(packOutput)
    graphics.title = `packOutput-${group.name}`
    global.debugGraphics?.push(graphics)
  }

  applyPackOutput(group, packOutput, clusterMap)
}
