import type {
  SchematicComponent,
  SchematicPort,
  SchematicTrace,
} from "circuit-json"
import type { Group } from "./Group"
import type { z } from "zod"
import {
  type InputNetlist,
  SchematicLayoutPipelineSolver,
  reorderChipPinsToCcw,
  convertCircuitJsonToInputNetlist,
  getRefKey,
  parseRefKey,
} from "@tscircuit/schematic-match-adapt"
import { circuitBuilderFromLayoutJson } from "@tscircuit/schematic-match-adapt"
import { createSchematicTraceCrossingSegments } from "../Trace/create-schematic-trace-crossing-segments"
import { createSchematicTraceJunctions } from "../Trace/create-schematic-trace-junctions"
import { getOtherSchematicTraces } from "../Trace/get-other-schematic-traces"
import { deriveSourceTraceIdFromMatchAdaptPath } from "lib/utils/schematic/deriveSourceTraceIdFromMatchAdaptPath"
import { cju } from "@tscircuit/circuit-json-util"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import corpus from "@tscircuit/schematic-corpus/dist/bundled-bpc-graphs.json"
import { convertCircuitJsonToBpc } from "circuit-json-to-bpc"
import {
  type BpcGraph,
  assignFloatingBoxPositions,
  netAdaptBpcGraph,
  getBpcGraphWlDistance,
  type FixedBpcGraph,
} from "bpc-graph"
import {} from "@tscircuit/circuit-json-util"

export function Group_doInitialSchematicLayoutMatchAdapt<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  // TODO use db.subtree({ source_group_id: ... })
  const subtreeCircuitJson = structuredClone(db.toArray())

  // Convert the subtree circuit json into a bpc graph
  const targetBpcGraph = convertCircuitJsonToBpc(subtreeCircuitJson)

  // Redundant, but assert that all the boxes are floating
  for (const box of targetBpcGraph.boxes) {
    if (box.kind === "fixed" || box.center) {
      box.kind = "floating"
      box.center = undefined
    }
  }

  // Find the best match in the corpus
  let bestMatch: BpcGraph = {
    boxes: [],
    pins: [],
  }
  let bestWlDistance = 0
  let winningBpcGraphName = "empty"
  for (const [candidateBpcGraphName, candidateBpcGraph] of Object.entries(
    corpus,
  )) {
    const wlDistance = getBpcGraphWlDistance(
      candidateBpcGraph as FixedBpcGraph,
      targetBpcGraph,
    )

    if (wlDistance > bestWlDistance) {
      bestMatch = candidateBpcGraph as FixedBpcGraph
      winningBpcGraphName = candidateBpcGraphName
      bestWlDistance = wlDistance
    }
  }

  console.log(`Winning BPC graph: ${winningBpcGraphName}`)

  // Adapt the best match
  const { adaptedBpcGraph } = netAdaptBpcGraph(
    bestMatch as FixedBpcGraph,
    targetBpcGraph,
  )

  // Assign the floating box positions
  const adaptedBpcGraphWithPositions =
    assignFloatingBoxPositions(adaptedBpcGraph)

  // Extract the new positions
  for (const box of adaptedBpcGraphWithPositions.boxes) {
    const schematic_component = db.schematic_component.get(box.boxId)
    if (schematic_component) {
      const ports = db.schematic_port.list({
        schematic_component_id: schematic_component.schematic_component_id,
      })
      const texts = db.schematic_text.list({
        schematic_component_id: schematic_component.schematic_component_id,
      })

      const positionDelta = {
        x: schematic_component.center.x - box.center.x,
        y: schematic_component.center.y - box.center.y,
      }

      for (const port of ports) {
        port.center.x += positionDelta.x
        port.center.y += positionDelta.y
      }

      for (const text of texts) {
        text.position.x += positionDelta.x
        text.position.y += positionDelta.y
      }

      schematic_component.center.x += positionDelta.x
      schematic_component.center.y += positionDelta.y
      continue
    }

    const schematic_net_label = db.schematic_net_label.get(box.boxId)

    if (schematic_net_label) {
      const pin = adaptedBpcGraphWithPositions.pins.find(
        (p) => p.boxId === box.boxId && p.color === "netlabel_center",
      )
      if (!pin) {
        throw new Error(`No pin found for net label: ${box.boxId}`)
      }
      schematic_net_label.center = box.center
      schematic_net_label.anchor_position = {
        x: box.center.x + pin.offset.x,
        y: box.center.y + pin.offset.y,
      }
      continue
    }

    console.error(`No schematic element found for box: ${box.boxId}`)
  }

  // Create schematic traces for any connections

  // console.dir(adaptedBpcGraphWithPositions, { depth: null })
}
