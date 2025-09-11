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

  for (const component of packInput.components) {
    const child = group.children.find(
      (c: any) =>
        c.pcb_component_id === component.componentId ||
        c.source_group_id === component.componentId,
    ) as any | undefined
    const childProps = child?._parsedProps ?? {}

    const parseMargin = (value: any) =>
      typeof value === "string" ? length.parse(value) : (value ?? 0)

    const marginLeft = parseMargin(
      childProps.pcbMarginLeft ?? childProps.pcbMarginX ?? childProps.pcbMargin,
    )
    const marginRight = parseMargin(
      childProps.pcbMarginRight ??
        childProps.pcbMarginX ??
        childProps.pcbMargin,
    )
    const marginTop = parseMargin(
      childProps.pcbMarginTop ?? childProps.pcbMarginY ?? childProps.pcbMargin,
    )
    const marginBottom = parseMargin(
      childProps.pcbMarginBottom ??
        childProps.pcbMarginY ??
        childProps.pcbMargin,
    )

    if (marginLeft || marginRight || marginTop || marginBottom) {
      let width: number | undefined
      let height: number | undefined

      const pcbComponent = db.pcb_component.get(component.componentId)
      if (pcbComponent) {
        width = pcbComponent.width
        height = pcbComponent.height
      } else {
        const pcbGroup = db.pcb_group
          .list()
          .find((g) => g.source_group_id === component.componentId)
        width = pcbGroup?.width
        height = pcbGroup?.height
      }

      if (width !== undefined && height !== undefined) {
        component.pads.push({
          padId: `__margin__${component.componentId}`,
          networkId: `__margin__${component.componentId}`,
          type: "rect",
          offset: {
            x: (marginRight - marginLeft) / 2,
            y: (marginTop - marginBottom) / 2,
          },
          size: {
            x: width + marginLeft + marginRight,
            y: height + marginTop + marginBottom,
          },
        })
      }
    }
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

  if (debug.enabled) {
    const graphics = getGraphicsFromPackOutput(packOutput)
    graphics.title = `packOutput-${group.name}`
    global.debugGraphics?.push(graphics)
  }

  applyPackOutput(group, packOutput, clusterMap)
}
