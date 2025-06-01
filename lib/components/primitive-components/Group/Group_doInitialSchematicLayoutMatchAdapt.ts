import type { SchematicComponent, SchematicPort } from "circuit-json"
import {
  type InputNetlist,
  SchematicLayoutPipelineSolver,
} from "@tscircuit/schematic-match-adapt"
import type { Group } from "./Group"
import type { z } from "zod"
import {
  type InputNetlist,
  reorderChipPinsToCcw,
  convertCircuitJsonToInputNetlist,
} from "@tscircuit/schematic-match-adapt"

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

  // console.log("boxes", boxes)
  // console.log("junctions", junctions)
  // console.log("netLabels", netLabels)
  // console.log("paths", paths)

  // -----------------------------------------------------------------
  // 1. Move chips (schematic_components) to solver-determined centers
  for (const box of boxes) {
    const srcComp = db.source_component.list().find((c) => c.name === box.boxId)
    if (!srcComp) continue

    const schComp = db.schematic_component
      .list()
      .find((sc) => sc.source_component_id === srcComp.source_component_id)

    if (schComp) {
      db.schematic_component.update(schComp.schematic_component_id, {
        center: { x: box.centerX, y: box.centerY },
      })
    }
  }
  return

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
  for (const p of paths) {
    if (!p.points || p.points.length < 2) continue

    const edges = p.points.slice(0, -1).map((pt, i) => ({
      from: pt,
      to: p.points[i + 1],
    }))

    db.schematic_trace.insert({
      edges,
      // Re-use global junction list – solver already de-duped it
      junctions,
    } as any)
  }
}
