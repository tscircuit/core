import type {
  SchematicComponent,
  SchematicNetLabel,
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
import corpus from "@tscircuit/schematic-corpus"
import {
  convertCircuitJsonToBpc,
  generateImplicitNetLabels,
} from "circuit-json-to-bpc"
import {
  type BpcGraph,
  assignFloatingBoxPositions,
  netAdaptBpcGraph,
  getBpcGraphWlDistance,
  layoutSchematicGraph,
  type FixedBpcGraph,
} from "bpc-graph"
import { getRelativeDirection } from "lib/utils/get-relative-direction"

const oppositeSideFromFacing: Record<
  string,
  "left" | "right" | "top" | "bottom"
> = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
}

export function Group_doInitialSchematicLayoutMatchAdapt<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  // TODO use db.subtree({ source_group_id: ... })
  const subtreeCircuitJson = structuredClone(db.toArray())

  // ------------------------------------------------------------------
  //  Add synthetic schematic_net_label elements for any schematic_port
  //  that is known to be connected to a net but does not already have a
  //  schematic_net_label at its position.  These extra labels allow the
  //  Match-Adapt BPC pipeline to create “boxes” for nets that otherwise
  //  would be missing.
  // ------------------------------------------------------------------
  const generatedNetLabels = generateImplicitNetLabels(subtreeCircuitJson)

  // Convert the subtree circuit json into a bpc graph
  const targetBpcGraph = convertCircuitJsonToBpc(
    subtreeCircuitJson.concat(generatedNetLabels),
  )

  // // Redundant, but assert that all the boxes are floating
  // for (const box of targetBpcGraph.boxes) {
  //   if (box.kind === "fixed" || box.center) {
  //     box.kind = "floating"
  //     box.center = undefined
  //   }
  // }

  // // Find the best match in the corpus
  // let bestMatch: BpcGraph = {
  //   boxes: [],
  //   pins: [],
  // }
  // let bestWlDistance = Infinity
  // let winningBpcGraphName = "empty"
  // for (const [candidateBpcGraphName, candidateBpcGraph] of Object.entries(
  //   corpus,
  // ).sort((a, b) => a[0].localeCompare(b[0]))) {
  //   const wlDistance = getBpcGraphWlDistance(
  //     candidateBpcGraph as FixedBpcGraph,
  //     targetBpcGraph,
  //   )
  //   console.log(candidateBpcGraphName, wlDistance)

  //   if (wlDistance < bestWlDistance) {
  //     bestMatch = candidateBpcGraph as FixedBpcGraph
  //     winningBpcGraphName = candidateBpcGraphName
  //     bestWlDistance = wlDistance
  //     if (wlDistance === 0) break
  //   }
  // }

  // console.log(`Winning BPC graph: ${winningBpcGraphName}`)

  // // Adapt the best match
  // const { adaptedBpcGraph } = netAdaptBpcGraph(
  //   bestMatch as FixedBpcGraph,
  //   targetBpcGraph,
  // )

  // // Assign the floating box positions
  // const adaptedBpcGraphWithPositions =
  //   assignFloatingBoxPositions(adaptedBpcGraph)

  const laidOutBpcGraph = layoutSchematicGraph(targetBpcGraph, {
    singletonKeys: ["vcc/2", "gnd/2"],
    centerPinColors: ["netlabel_center", "component_center"],
    floatingBoxIdsWithMutablePinOffsets: new Set(
      targetBpcGraph.boxes
        .filter((b) =>
          targetBpcGraph.pins.some(
            (p) => p.boxId === b.boxId && p.color === "netlabel_center",
          ),
        )
        .map((b) => b.boxId),
    ),
    corpus,
  })

  // Offset returned coordinates by the group's global schematic position so
  // that match-adapt layouts respect the group's schX/schY props
  const groupOffset = group._getGlobalSchematicPositionBeforeLayout()

  // Extract the new positions
  for (const box of laidOutBpcGraph.boxes) {
    if (!box.center) continue
    const schematic_component = db.schematic_component.get(box.boxId)
    if (schematic_component) {
      const newCenter = {
        x: box.center.x + groupOffset.x,
        y: box.center.y + groupOffset.y,
      }
      const ports = db.schematic_port.list({
        schematic_component_id: schematic_component.schematic_component_id,
      })
      const texts = db.schematic_text.list({
        schematic_component_id: schematic_component.schematic_component_id,
      })

      const positionDelta = {
        x: newCenter.x - schematic_component.center.x,
        y: newCenter.y - schematic_component.center.y,
      }

      for (const port of ports) {
        port.center.x += positionDelta.x
        port.center.y += positionDelta.y
      }

      for (const text of texts) {
        text.position.x += positionDelta.x
        text.position.y += positionDelta.y
      }

      schematic_component.center = newCenter
      continue
    }

    console.log({ boxId: box.boxId })
    const schematic_net_label = db.schematic_net_label.get(box.boxId)

    if (schematic_net_label) {
      const pin = laidOutBpcGraph.pins.find(
        (p) => p.boxId === box.boxId && p.color === "netlabel_center",
      )
      if (!pin) {
        throw new Error(`No pin found for net label: ${box.boxId}`)
      }
      const finalCenter = {
        x: box.center.x + groupOffset.x,
        y: box.center.y + groupOffset.y,
      }
      schematic_net_label.center = finalCenter
      schematic_net_label.anchor_position = {
        x: finalCenter.x + pin.offset.x,
        y: finalCenter.y + pin.offset.y,
      }
      continue
    }

    const matchedGeneratedNetLabel = generatedNetLabels.find(
      (l) => l.schematic_net_label_id === box.boxId,
    )

    console.log({ matchedGeneratedNetLabel })

    if (matchedGeneratedNetLabel) {
      // Check if a schematic net label already exists for this net
      const existingNetLabel = db.schematic_net_label
        .list()
        .find(
          (label) =>
            label.source_net_id === matchedGeneratedNetLabel.source_net_id,
        )

      if (existingNetLabel) {
        // Update existing net label with match-adapt positioning
        const pins = laidOutBpcGraph.pins.filter((p) => p.boxId === box.boxId)
        const center = pins.find((p) => p.color === "netlabel_center")!
        const anchor = pins.find((p) => p.color !== "netlabel_center")!

        const nlDir = getRelativeDirection(anchor.offset, center.offset)
        const nlSide = oppositeSideFromFacing[nlDir]
        const color = anchor.color as "vcc" | "gnd" | "normal"
        const symbolName =
          color === "vcc" ? "vcc" : color === "gnd" ? "gnd" : undefined
        const anchorSide =
          color === "vcc" ? "bottom" : color === "gnd" ? "top" : nlSide

        // Update the existing net label with match-adapt positioning
        existingNetLabel.anchor_position = {
          x: box.center.x + groupOffset.x + center.offset.x,
          y: box.center.y + groupOffset.y + center.offset.y,
        }
        existingNetLabel.center = {
          x: box.center.x + groupOffset.x + center.offset.x,
          y: box.center.y + groupOffset.y + center.offset.y,
        }
        existingNetLabel.anchor_side = anchorSide
        if (symbolName) {
          existingNetLabel.symbol_name = symbolName
        }
      } else {
        // Create new net label only if none exists
        const pins = laidOutBpcGraph.pins.filter((p) => p.boxId === box.boxId)
        const center = pins.find((p) => p.color === "netlabel_center")!
        const anchor = pins.find((p) => p.color !== "netlabel_center")!

        const nlDir = getRelativeDirection(anchor.offset, center.offset)
        const nlSide = oppositeSideFromFacing[nlDir]
        const color = anchor.color as "vcc" | "gnd" | "normal"
        const symbolName =
          color === "vcc" ? "vcc" : color === "gnd" ? "gnd" : undefined
        const anchorSide =
          color === "vcc" ? "bottom" : color === "gnd" ? "top" : nlSide

        const source_net = db.source_net.get(
          matchedGeneratedNetLabel.source_net_id,
        )!
        // Insert a netlabel into the actual db, but map colors to specific symbols
        const schematic_net_label = {
          type: "schematic_net_label",
          schematic_net_label_id: `netlabel_for_${box.boxId}`,
          text: source_net.name, // no text; just a placeholder box for Match-Adapt
          anchor_position: {
            x: box.center.x + groupOffset.x + center.offset.x,
            y: box.center.y + groupOffset.y + center.offset.y,
          },
          center: {
            x: box.center.x + groupOffset.x + center.offset.x,
            y: box.center.y + groupOffset.y + center.offset.y,
          },
          anchor_side: anchorSide,
          symbol_name: symbolName,
          source_net_id: matchedGeneratedNetLabel.source_net_id,
          source_trace_id: matchedGeneratedNetLabel.source_trace_id,
        } as SchematicNetLabel

        db.schematic_net_label.insert(schematic_net_label)
      }

      continue
    }

    console.error(
      `No schematic element found for box: ${box.boxId}. This is a bug in the matchAdapt binding with @tscircuit/core`,
    )
  }

  // Create schematic traces for any connections

  // console.dir(adaptedBpcGraphWithPositions, { depth: null })
}
