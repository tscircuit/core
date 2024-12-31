import type { SoupUtilObjects } from "@tscircuit/soup-util"
import Elk, { type ElkNode } from "elkjs"
import { transformSchematicElement } from "@tscircuit/soup-util"
import { translate } from "transformation-matrix"

interface LayoutNode {
  id: string
  x: number
  y: number
  width: number
  height: number
  ports: Array<{
    id: string
    x: number
    y: number
  }>
}

export async function layoutSchematicWithElk(db: SoupUtilObjects) {
  const components = db.schematic_component.list()
  const ports = db.schematic_port.list()

  const elk = new Elk({
    workerUrl: "./node_modules/elkjs/lib/elk-worker.min.js",
    algorithms: ["layered"],
  })

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      // 'layered.spacing.betweenLayers': '1',
      "elk.spacing.componentComponent": "1",
    },
    children: components.map((comp) => {
      return {
        id: comp.schematic_component_id,
        width: comp.size?.width ?? 50,
        height: comp.size?.height ?? 50,
        ports: ports
          .filter(
            (p) => p.schematic_component_id === comp.schematic_component_id,
          )
          .map((port) => {
            const horizontal =
              port.facing_direction === "up" || port.facing_direction === "down"
            const size = horizontal
              ? { width: port.distance_from_component_edge, height: 0.1 }
              : { width: 0.1, height: port.distance_from_component_edge }
            return {
              id: port.schematic_port_id,
              ...size,
            }
          }),
      }
    }),
  }

  const layout = await elk.layout(graph)

  for (const node of layout.children ?? []) {
    const schematicComponent = db.schematic_component.get(node.id)
    const schematicText = db.schematic_text
      .list()
      .filter((text) => text.schematic_component_id === node.id)
    if (schematicText.length > 0) {
      for (const text of schematicText) {
        const mat = translate(node.x || 0, node.y)
        transformSchematicElement(text, mat)
      }
    }
    const mat = translate(node.x || 0, node.y)
    transformSchematicElement(schematicComponent as any, mat)

    for (const port of node.ports ?? []) {
      const circuitPort = db.schematic_port.get(port.id)
      const mat = translate(node.x || 0, node.y)
      transformSchematicElement(circuitPort as any, mat)
    }
  }
}
