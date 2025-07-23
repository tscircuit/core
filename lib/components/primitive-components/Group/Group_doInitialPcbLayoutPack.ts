import type { Group } from "./Group"
import { buildSubtree } from "@tscircuit/circuit-json-util"
import {
  pack,
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
} from "calculate-packing"
import { length } from "circuit-json"
import { transformPCBElements } from "@tscircuit/circuit-json-util"
import { translate } from "transformation-matrix"

const sub = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: a.x - b.x,
  y: a.y - b.y,
})

export const Group_doInitialPcbLayoutPack = (group: Group) => {
  const { db } = group.root!
  const { _parsedProps: props } = group

  const { packOrderStrategy, packPlacementStrategy, gap } = props

  const subtreeCircuitJson = buildSubtree(db.toArray(), {
    source_group_id: group.source_group_id!,
  })

  const gapMm = length.parse(gap ?? "0mm")
  const packInput = {
    ...convertPackOutputToPackInput(
      convertCircuitJsonToPackOutput(subtreeCircuitJson),
    ),
    orderStrategy: packOrderStrategy,
    placementStrategy: packPlacementStrategy,
    minGap: gapMm,
  }

  const packOutput = pack(packInput)

  // Apply the pack output to the circuit json
  for (const packedComponent of packOutput.components) {
    const { center, componentId, pads, ccwRotationOffset } = packedComponent
    const component = db.pcb_component.get(componentId)
    if (!component) continue
    const delta = sub(center, component.center)
    transformPCBElements(
      subtreeCircuitJson.filter(
        (elm) =>
          "pcb_component_id" in elm && elm.pcb_component_id === componentId,
      ),
      translate(delta.x, delta.y),
    )
  }
}
