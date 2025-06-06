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
import { circuitBuilderFromLayoutJson } from "lib/utils/schematic/circuitBuilderFromLayoutJson"
import { createSchematicTraceCrossingSegments } from "../Trace/create-schematic-trace-crossing-segments"
import { createSchematicTraceJunctions } from "../Trace/create-schematic-trace-junctions"
import { getOtherSchematicTraces } from "../Trace/get-other-schematic-traces"
import { deriveSourceTraceIdFromMatchAdaptPath } from "lib/utils/schematic/deriveSourceTraceIdFromMatchAdaptPath"
import { cju } from "@tscircuit/circuit-json-util"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"

export function Group_doInitialSchematicLayoutMatchAdapt<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { db } = group.root!

  // TODO use db.subtree({ source_group_id: ... })
  let subtreeCircuitJson = structuredClone(db.toArray())

  // Reorder the pins of the schematic components to be in CCW order
  subtreeCircuitJson = reorderChipPinsToCcw(subtreeCircuitJson)

  const inputNetlist = convertCircuitJsonToInputNetlist(subtreeCircuitJson)

  // Run the SchematicLayoutPipelineSolver
  const templateFns = group._parsedProps.matchAdaptTemplate
    ? [
        () =>
          circuitBuilderFromLayoutJson(
            group._parsedProps.matchAdaptTemplate as any,
          ),
      ]
    : undefined

  const solver = new SchematicLayoutPipelineSolver({
    inputNetlist,
    templateFns,
  })

  let solvedLayout: ReturnType<typeof solver.getLayout> | null = null
  try {
    solver.solve()
    solvedLayout = solver.getLayout()
  } catch (e: any) {
    db.schematic_layout_error.insert({
      message: `Match-adapt layout failed: ${e.toString()}`,
      source_group_id: group.source_group_id!,
      schematic_group_id: group.schematic_group_id!,
    })
    return
  }

  const { boxes, junctions, netLabels, paths } = solvedLayout!

  const layoutConnMap = new ConnectivityMap({})

  for (const path of paths) {
    layoutConnMap.addConnections([[getRefKey(path.from), getRefKey(path.to)]])
  }
  for (const junction of junctions) {
    for (const path of paths) {
      for (const pathPoint of path.points) {
        if (
          Math.abs(pathPoint.x - junction.x) < 0.001 &&
          Math.abs(pathPoint.y - junction.y) < 0.001
        ) {
          layoutConnMap.addConnections([
            [getRefKey(path.from), getRefKey(junction)],
            [getRefKey(path.to), getRefKey(junction)],
          ])
        }
      }
    }
  }

  // -----------------------------------------------------------------
  // 1. Move chips (schematic_components) to solver-determined centers
  for (const box of boxes) {
    const srcComp = db.source_component.list().find((c) => c.name === box.boxId)
    if (!srcComp) continue

    const schComp = db.schematic_component.getWhere({
      source_component_id: srcComp.source_component_id,
    })

    if (!schComp) continue

    const schCompMoveDelta = {
      x: box.centerX - schComp.center.x + 0.1, // TODO figure out why +0.1
      y: box.centerY - schComp.center.y - 0.1,
    }

    db.schematic_component.update(schComp.schematic_component_id, {
      center: {
        x: schComp.center.x + schCompMoveDelta.x,
        y: schComp.center.y + schCompMoveDelta.y,
      },
    })
    // Update all the pins in the schematic component
    const schematicPorts = db.schematic_port.list({
      schematic_component_id: schComp.schematic_component_id,
    })

    for (const schematicPort of schematicPorts) {
      db.schematic_port.update(schematicPort.schematic_port_id, {
        center: {
          x: schematicPort.center.x + schCompMoveDelta.x,
          y: schematicPort.center.y + schCompMoveDelta.y,
        },
      })
    }

    // Update schematic text positions
    const schematicTexts = db.schematic_text.list({
      schematic_component_id: schComp.schematic_component_id,
    })

    for (const schematicText of schematicTexts) {
      db.schematic_text.update(schematicText.schematic_text_id, {
        position: {
          x: schematicText.position.x + schCompMoveDelta.x,
          y: schematicText.position.y + schCompMoveDelta.y,
        },
      })
    }
  }

  // -----------------------------------------------------------------
  // 2. Create schematic net-labels
  for (const nl of netLabels) {
    const srcNet = db.source_net.list().find((n) => n.name === nl.netId)

    db.schematic_net_label.insert({
      text: nl.netId,
      source_net_id: srcNet?.source_net_id,
      anchor_position: { x: nl.x, y: nl.y },
      center: { x: nl.x, y: nl.y },
      anchor_side: nl.anchorPosition as any,
    } as any)
  }

  // -----------------------------------------------------------------
  // 3. Create schematic traces from solver paths
  for (const path of paths) {
    if (!path.points || path.points.length < 2) continue

    // Get the source trace id for this path
    // We can find the
    const sourceTraceId = deriveSourceTraceIdFromMatchAdaptPath({
      path: path,
      db: cju(subtreeCircuitJson),
      layoutConnMap,
    })

    let edges: SchematicTrace["edges"] = []

    for (let i = 0; i < path.points.length - 1; i++) {
      edges.push({
        from: {
          x: path.points[i].x,
          y: path.points[i].y,
        },
        to: {
          x: path.points[i + 1].x,
          y: path.points[i + 1].y,
        },
      })
    }

    // Create crossings with traces from different nets
    const otherCrossingEdges = getOtherSchematicTraces({
      db,
      source_trace_id: sourceTraceId,
      differentNetOnly: true,
    }).flatMap((t) => t.edges)

    if (otherCrossingEdges.length > 0) {
      edges = createSchematicTraceCrossingSegments({
        edges,
        otherEdges: otherCrossingEdges,
      })
    }

    // Create junctions with traces from the same net
    const junctions = createSchematicTraceJunctions({
      edges,
      db,
      source_trace_id: sourceTraceId,
    })

    // Insert the schematic trace
    db.schematic_trace.insert({
      source_trace_id: sourceTraceId,
      edges,
      junctions,
    } as any)
  }
}
