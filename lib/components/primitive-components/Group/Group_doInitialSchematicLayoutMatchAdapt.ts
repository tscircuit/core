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

  console.log("boxes", boxes)
  console.log("junctions", junctions)
  console.log("netLabels", netLabels)
  console.log("paths", paths)

  // TODO Create schematic net labels
  // TODO create schematic_trace from paths
  // TODO move chips to positions as given by boxes
}
