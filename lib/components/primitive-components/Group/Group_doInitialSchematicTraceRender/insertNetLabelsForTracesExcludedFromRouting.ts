import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"

export function insertNetLabelsForTracesExcludedFromRouting(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  displayLabelTraces: any[]
}) {
  const { group, displayLabelTraces } = args
  const { db } = group.root!

  for (const trace of displayLabelTraces as any[]) {
    const label = trace._parsedProps?.schDisplayLabel
    if (!label) continue
    try {
      const res = trace._findConnectedPorts?.()
      if (!res?.allPortsFound || !res.ports || res.ports.length < 1) continue
      const ports = res.ports.slice(0, 2)
      for (const port of ports) {
        const anchor_position = port._getGlobalSchematicPositionAfterLayout()
        const side =
          getEnteringEdgeFromDirection(port.facingDirection || "right") ||
          "right"
        const center = computeSchematicNetLabelCenter({
          anchor_position,
          anchor_side: side as any,
          text: label,
        })
        // @ts-ignore
        db.schematic_net_label.insert({
          text: label,
          anchor_position,
          center,
          anchor_side: side as any,
          ...(trace.source_trace_id
            ? { source_trace_id: trace.source_trace_id }
            : {}),
        })
      }
    } catch {}
  }
}
