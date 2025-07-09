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
import { createSchematicTraceCrossingSegments } from "../Trace/trace-utils/create-schematic-trace-crossing-segments"
import { createSchematicTraceJunctions } from "../Trace/trace-utils/create-schematic-trace-junctions"
import { getOtherSchematicTraces } from "../Trace/trace-utils/get-other-schematic-traces"
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
  getGraphicsForBpcGraph,
} from "bpc-graph"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

export function Group_doInitialSchematicLayoutMatchAdapt<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  // TODO use db.subtree({ source_group_id: ... })
  const subtreeCircuitJson = structuredClone(db.toArray())

  const bpcGraphBeforeGeneratedNetLabels =
    convertCircuitJsonToBpc(subtreeCircuitJson)
  console.log("Writing bpcGraphBeforeGeneratedNetLabels.svg")
  Bun.write(
    "bpcGraphBeforeGeneratedNetLabels.svg",
    getSvgFromGraphicsObject(
      getGraphicsForBpcGraph(bpcGraphBeforeGeneratedNetLabels),
      {
        backgroundColor: "white",
      },
    ),
  )

  console.log("subcircuit with generated net labels")
  subtreeCircuitJson.concat()

  // ------------------------------------------------------------------
  //  Add synthetic schematic_net_label elements for any schematic_port
  //  that is known to be connected to a net but does not already have a
  //  schematic_net_label at its position.  These extra labels allow the
  //  Match-Adapt BPC pipeline to create “boxes” for nets that otherwise
  //  would be missing.
  // ------------------------------------------------------------------
  const existingLabels = new Set(
    subtreeCircuitJson
      .filter((e) => e.type === "schematic_net_label")
      .map((e: any) => `${e.anchor_position?.x},${e.anchor_position?.y}`),
  )

  const oppositeSideFromFacing: Record<
    string,
    "left" | "right" | "top" | "bottom"
  > = {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top",
  }

  const generatedNetLabels = new Map<
    string,
    { schematic_net_label: SchematicNetLabel; schematic_port: SchematicPort }
  >()

  const implicitNetLabels = generateImplicitNetLabels(subtreeCircuitJson)

  for (const netLabel of implicitNetLabels) {
    // @ts-expect-error- waiting for circuit-json to add schematic_port_id to net labels
    if (!netLabel.schematic_port_id) {
      throw new Error(
        `No schematic port id found for net label: ${netLabel.schematic_net_label_id}`,
      )
    }
    // @ts-expect-error - waiting for circuit-json to add schematic_port_id to net labels
    const schematic_port = db.schematic_port.get(netLabel.schematic_port_id)
    if (!schematic_port) {
      throw new Error(
        `No schematic port found for net label: ${netLabel.schematic_net_label_id}`,
      )
    }
    generatedNetLabels.set(netLabel.schematic_net_label_id, {
      schematic_net_label: netLabel,
      schematic_port,
    })
  }

  console.log("Writing subtreeCircuitJsonWithInferredNetLabels.svg")
  Bun.write(
    "subtreeCircuitJsonWithInferredNetLabels.svg",
    convertCircuitJsonToSchematicSvg(
      subtreeCircuitJson.concat(implicitNetLabels),
    ),
  )

  // for (const sp of subtreeCircuitJson.filter(
  //   (e) => e.type === "schematic_port",
  // )) {
  //   const key = `${sp.center.x},${sp.center.y}`
  //   if (existingLabels.has(key)) continue // already has a label here

  //   // Try to find a net this port belongs to (falls back to undefined)
  //   const srcPort = db.source_port.get(sp.source_port_id)
  //   const srcNet = db.source_net.getWhere({
  //     subcircuit_connectivity_map_key: srcPort?.subcircuit_connectivity_map_key,
  //   })
  //   if (!srcNet) {
  //     console.error(`No source net found for port: ${sp.source_port_id}`)
  //     continue
  //   }

  //   const srcTrace = db.source_trace.getWhere({
  //     subcircuit_connectivity_map_key: srcPort?.subcircuit_connectivity_map_key,
  //   })

  //   const schematic_net_label_id = `netlabel_for_${sp.schematic_port_id}`
  //   const source_net = db.source_net.get(srcNet.source_net_id)!
  //   const schematic_net_label = {
  //     type: "schematic_net_label",
  //     schematic_net_label_id,
  //     text: source_net.name,
  //     source_net_id: srcNet.source_net_id,
  //     source_trace_id: srcTrace?.source_trace_id,
  //     anchor_position: { ...sp.center },
  //     center: { ...sp.center },
  //     anchor_side:
  //       oppositeSideFromFacing[
  //         sp.facing_direction as keyof typeof oppositeSideFromFacing
  //       ] ?? "right",
  //   } as SchematicNetLabel

  //   generatedNetLabels.set(schematic_net_label_id, {
  //     schematic_net_label,
  //     schematic_port: sp,
  //   })

  //   subtreeCircuitJson.push(schematic_net_label)
  // }

  console.log("Writing subtreeCircuitJson.svg")
  Bun.write(
    "subtreeCircuitJson.svg",
    convertCircuitJsonToSchematicSvg(subtreeCircuitJson),
  )

  // Convert the subtree circuit json into a bpc graph
  const targetBpcGraph = convertCircuitJsonToBpc(
    subtreeCircuitJson.concat(implicitNetLabels),
  )

  console.log("Writing targetBpcGraph.svg")
  Bun.write(
    "targetBpcGraph.svg",
    getSvgFromGraphicsObject(getGraphicsForBpcGraph(targetBpcGraph), {
      backgroundColor: "white",
    }),
  )

  console.log("Writing bpcGraphWithoutImplicitNetLabels.svg")
  Bun.write(
    "bpcGraphWithoutImplicitNetLabels.svg",
    getSvgFromGraphicsObject(
      getGraphicsForBpcGraph(convertCircuitJsonToBpc(subtreeCircuitJson)),
      {
        backgroundColor: "white",
      },
    ),
  )

  const laidOutBpcGraph = layoutSchematicGraph(targetBpcGraph, {
    singletonKeys: ["vcc/2", "gnd/2"],
    centerPinColors: ["netlabel_center", "component_center"],
    floatingBoxIdsWithMutablePinOffsets: new Set(
      targetBpcGraph.boxes
        .filter((box) => {
          const boxPins = targetBpcGraph.pins.filter(
            (p) => p.boxId === box.boxId,
          )
          const nonCenterBoxPins = boxPins.filter(
            (bp) => !bp.color.includes("center"),
          )
          if (nonCenterBoxPins.length <= 2) {
            return true
          }
          return false
        })
        .map((b) => b.boxId),
    ),
    corpus,
  })

  console.log("Writing laidOutBpcGraph.svg")
  Bun.write(
    "laidOutBpcGraph.svg",
    getSvgFromGraphicsObject(getGraphicsForBpcGraph(laidOutBpcGraph), {
      backgroundColor: "white",
    }),
  )

  // Offset returned coordinates by the group's global schematic position so
  // that match-adapt layouts respect the group's schX/schY props
  const groupOffset = group._getGlobalSchematicPositionBeforeLayout()

  console.table(
    implicitNetLabels.map((nl) => ({
      id: nl.schematic_net_label_id,
      ...nl.center,
    })),
  )
  const implicitNetLabelIds = implicitNetLabels.map(
    (nl) => nl.schematic_net_label_id,
  )
  console.table(
    laidOutBpcGraph.boxes
      .filter((b) => implicitNetLabelIds.includes(b.boxId))
      .map((b) => ({
        id: b.boxId,
        ...b.center,
      })),
  )

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

    if (generatedNetLabels.has(box.boxId)) {
      const { schematic_net_label: generatedNetLabel, schematic_port } =
        generatedNetLabels.get(box.boxId)!
      // Create an approp
      const pins = laidOutBpcGraph.pins.filter((p) => p.boxId === box.boxId)
      const center = pins.find((p) => p.color === "netlabel_center")!
      const anchor = pins.find((p) => p.color !== "netlabel_center")!

      const color = anchor.color as "vcc" | "gnd" | "normal"

      const symbolName =
        color === "vcc" ? "vcc" : color === "gnd" ? "gnd" : undefined

      // TODO this should be based on the relative position of center/anchor
      const anchorSide =
        color === "vcc"
          ? "bottom"
          : color === "gnd"
            ? "top"
            : (oppositeSideFromFacing[
                schematic_port.facing_direction as keyof typeof oppositeSideFromFacing
              ] ?? "right")

      const source_net = db.source_net.get(generatedNetLabel.source_net_id)!
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
        source_net_id: generatedNetLabel.source_net_id,
        source_trace_id: generatedNetLabel.source_trace_id,
      } as SchematicNetLabel

      db.schematic_net_label.insert(schematic_net_label)

      continue
    }

    console.error(
      `No schematic element found for box: ${box.boxId}. This is a bug in the matchAdapt binding with @tscircuit/core`,
    )
  }

  // Create schematic traces for any connections

  // console.dir(adaptedBpcGraphWithPositions, { depth: null })
}
