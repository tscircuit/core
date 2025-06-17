import type { Group } from "./Group"
import type { z } from "zod"
import { ForceDirectedLayoutSolver } from "box-pin-color-graph"
import { convertCircuitJsonToBpc } from "circuit-json-to-bpc"

export function Group_doInitialSchematicLayoutMatchAdapt<
  Props extends z.ZodType<any, any, any>,
>(group: Group<Props>): void {
  const { root } = group
  const db = root?.db!

  // 1. Convert the circuit json to a BPC
  const bpc = convertCircuitJsonToBpc(db.toArray())

  // 2. Force-layout the BPC
  const forceLayoutSolver = new ForceDirectedLayoutSolver({
    graph: bpc,
  })
  forceLayoutSolver.solve()

  const newGraph = forceLayoutSolver.graph

  // 3. Apply the updated component positions to the circuit json
  for (const box of newGraph.boxes) {
    const originalBox = bpc.boxes.find((b) => b.boxId === box.boxId)
    const positionDelta = {
      x: box.center!.x - originalBox!.center!.x,
      y: box.center!.y - originalBox!.center!.y,
    }

    db.schematic_component.update(box.boxId, {
      center: {
        x: box.center!.x,
        y: box.center!.y,
      },
    })

    const schPorts = db.schematic_port.list({
      schematic_component_id: box.boxId,
    })

    for (const schPort of schPorts) {
      db.schematic_port.update(schPort.schematic_port_id, {
        center: {
          x: schPort.center!.x + positionDelta.x,
          y: schPort.center!.y + positionDelta.y,
        },
      })
    }
  }
}
