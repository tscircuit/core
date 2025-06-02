import type { SchematicComponent, SchematicPort } from "circuit-json"
import type { Group } from "./Group"
import type { z } from "zod"
import {
  type InputNetlist,
  SchematicLayoutPipelineSolver,
  reorderChipPinsToCcw,
  convertCircuitJsonToInputNetlist,
} from "@tscircuit/schematic-match-adapt"
import { createSchematicTraceCrossingSegments } from "../Trace/create-schematic-trace-crossing-segments"
import { createSchematicTraceJunctions } from "../Trace/create-schematic-trace-junctions"
import { getOtherSchematicTraces } from "../Trace/get-other-schematic-traces"

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
  const solver = new SchematicLayoutPipelineSolver({
    inputNetlist,
  })
  solver.solve()

  const { boxes, junctions, netLabels, paths } = solver.getLayout()

  // Bun.write("test.json", JSON.stringify(solver.getLayout(), null, 2))

  // console.log("boxes", boxes)
  // console.log("junctions", junctions)
  // console.log("netLabels", netLabels)
  // console.log("paths", paths)

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
  // for (const p of paths) {
  //   if (!p.points || p.points.length < 2) continue

  //   // Get the source trace id for this path
  //   // We can find the
  //   const { source_trace_id } = deriveSourceTraceIdFromPath(
  //     p,
  //     cju(subtreeCircuitJson),
  //   )
  //   console.log("p", p)

  //   // Create crossings with traces from different nets
  //   const otherCrossingEdges = getOtherSchematicTraces({
  //     db,
  //     source_trace_id: tempSourceTraceId,
  //     differentNetOnly: true,
  //   }).flatMap((t) => t.edges)

  //   if (otherCrossingEdges.length > 0) {
  //     edges = createSchematicTraceCrossingSegments({
  //       edges,
  //       otherEdges: otherCrossingEdges,
  //     })
  //   }

  //   // Create junctions with traces from the same net
  //   // const junctions = createSchematicTraceJunctions({
  //   //   edges,
  //   //   db,
  //   //   source_trace_id: tempSourceTraceId,
  //   // })

  //   // Insert the schematic trace
  //   db.schematic_trace.insert({
  //     source_trace_id: tempSourceTraceId,
  //     edges,
  //     junctions: [],
  //   } as any)
  // }
}
