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
  const sourceTraces = db.source_trace.list()
  const ports = db.schematic_port.list()

  const elk = new Elk({
    workerUrl: "./node_modules/elkjs/lib/elk-worker.min.js",
    algorithms: ["layered"],
  })

  const edges = sourceTraces
    .map((trace) => {
      if (trace.connected_source_port_ids.length < 2) return undefined

      const fromPortId = trace.connected_source_port_ids[0]
      const fromPort = db.source_port.get(fromPortId)
      const toPortId = trace.connected_source_port_ids[1]
      const toPort = db.source_port.get(toPortId)

      return {
        id: trace.source_trace_id,
        sources: [`${fromPortId}`],
        targets: [`${toPortId}`],
      }
      // return {id:trace.source_trace_id,sources:[`${fromPort?.source_component_id}:${fromPortId}`],targets:[`${toPort?.source_component_id}:${toPortId}`]}
    })
    .filter((edge) => edge !== undefined)

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      // V0
      // "elk.algorithm": "layered",
      // "elk.spacing.componentComponent": "1.5",
      // "elk.layered.nodePlacement.strategy": "INTERACTIVE",
      // "elk.layered.spacing.nodeNodeBetweenLayers": "1.5",
      // "elk.spacing.nodeNode": "1",
      // "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      // "elk.layered.nodePlacement.strategy": "SIMPLE",

      // V1
      "elk.compaction.compactionStrategy": "DEPTH_FIRST",
      "elk.direction": "RIGHT",
      "elk.layered.considerModelOrder.components": "MODEL_ORDER",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.spacing.componentComponent": "1",
      "elk.layered.spacing.edgeNodeBetweenLayers": "1",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "1",
      "elk.algorithm": "layered",
      "elk.spacing.nodeNode": "1",
      "elk.spacing.edgeNode": "1",
      "elk.spacing.edgeEdge": "1",
      "elk.layered.spacing.nodeNodeBetweenLayers": "1",
      "elk.layered.spacing.baseValue": "1",
      "elk.layered.crossingMinimization.semiInteractive": "true",
      "elk.portConstraints": "FIXED_SIDE",
      "elk.layered.spacing.edgeEdge": "1",

      // V2
      "elk.layered.nodePlacement.bk.fixedAlignment": "CENTER",
      "elk.layered.compaction.postCompaction.strategy": "ALL",
      "elk.layered.nodePlacement.strategy": "SIMPLE",
      "elk.edgeRouting": "POLYLINE",
    },
    children: components.map((comp) => {
      return {
        id: comp.source_component_id,
        width: comp.size?.width ?? 50,
        height: comp.size?.height ?? 50,
        edges: [],
        layoutOptions: {
          "elk.portConstraints": "FIXED_SIDE",
        },
        ports: ports
          .filter(
            (p) => p.schematic_component_id === comp.schematic_component_id,
          )
          .map((port) => {
            const horizontal =
              port.facing_direction === "up" || port.facing_direction === "down"
            const size = horizontal
              ? {
                  width: port.distance_from_component_edge || 0,
                  height: 0.5,
                }
              : {
                  width: 0.5,
                  height: port.distance_from_component_edge || 0,
                }
            const position =
              port.facing_direction === "up"
                ? "NORTH"
                : port.facing_direction === "down"
                  ? "SOUTH"
                  : port.facing_direction === "left"
                    ? "WEST"
                    : "EAST"
            return {
              id: port.source_port_id,
              layoutOptions: {
                "elk.port.side": position,
              },
              ...size,
            }
          }),
      }
    }),
    edges,
  }
  console.log("starting elkjs")
  const current = Date.now()
  const layout = await elk.layout(graph)
  console.log("finished elkjs in: ", Date.now() - current)

  for (const node of layout.children ?? []) {
    const schematicComponent = db.schematic_component.getWhere({
      source_component_id: node.id,
    })
    const schematicText = db.schematic_text
      .list()
      .filter(
        (text) =>
          text.schematic_component_id ===
          schematicComponent?.schematic_component_id,
      )
    if (schematicText.length > 0) {
      for (const text of schematicText) {
        const mat = translate(node.x || 0, node.y)
        transformSchematicElement(text, mat)
      }
    }
    const mat = translate(node.x || 0, node.y)
    transformSchematicElement(schematicComponent as any, mat)

    for (const port of node.ports ?? []) {
      const circuitPort = db.schematic_port.getWhere({
        source_port_id: port.id,
      })
      const mat = translate(node.x || 0, node.y)
      transformSchematicElement(circuitPort as any, mat)
    }
  }
}
