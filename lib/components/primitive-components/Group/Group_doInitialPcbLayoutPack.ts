import type { Group } from "./Group"
import { buildSubtree } from "@tscircuit/circuit-json-util"
import {
  pack,
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
  getGraphicsFromPackOutput,
} from "calculate-packing"
import { length } from "circuit-json"
import {
  transformPCBElements,
  getCircuitJsonTree,
} from "@tscircuit/circuit-json-util"
import { translate, rotate, compose } from "transformation-matrix"
import Debug from "debug"

const debug = Debug("Group_doInitialPcbLayoutPack")

export const Group_doInitialPcbLayoutPack = (group: Group) => {
  const { db } = group.root!
  const { _parsedProps: props } = group

  const { packOrderStrategy, packPlacementStrategy, gap } = props

  const gapMm = length.parse(gap ?? "0mm")
  const packInput = {
    ...convertPackOutputToPackInput(
      convertCircuitJsonToPackOutput(db.toArray(), {
        source_group_id: group.source_group_id!,
      }),
    ),
    orderStrategy: packOrderStrategy ?? "largest_to_smallest",
    placementStrategy:
      packPlacementStrategy ?? "shortest_connection_along_outline",
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
    const { center, componentId, ccwRotationOffset } = packedComponent
    const component = db.pcb_component.get(componentId)
    if (!component) continue

    // Create transformation matrix: translate to origin, rotate, then translate to final position
    const originalCenter = component.center
    const transformMatrix = compose(
      group._computePcbGlobalTransformBeforeLayout(),
      translate(center.x, center.y),
      rotate(ccwRotationOffset || 0),
      translate(-originalCenter.x, -originalCenter.y),
    )

    transformPCBElements(
      db
        .toArray()
        .filter(
          (elm) =>
            "pcb_component_id" in elm && elm.pcb_component_id === componentId,
        ),
      transformMatrix,
    )
  }
}
