import { Group } from "../Group";
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver";
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter";
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection";

export function insertNetLabelsForTracesExcludedFromRouting(args: {
  group: Group<any>;
  solver: SchematicTracePipelineSolver;
  displayLabelTraces: any[];
  pinIdToSchematicPortId: Map<string, string>;
  schematicPortIdsWithPreExistingNetLabels: Set<string>;
}) {
  const {
    group,
    displayLabelTraces,
    pinIdToSchematicPortId,
    schematicPortIdsWithPreExistingNetLabels,
  } = args;
  const { db } = group.root!;

  for (const trace of displayLabelTraces as any[]) {
    const label = trace._parsedProps?.schDisplayLabel;
    if (!label) continue;
    try {
      const res = trace._findConnectedPorts?.();
      if (!res?.allPortsFound || !res.ports || res.ports.length < 1) continue;
      const ports = res.ports.slice(0, 2);
      for (const port of ports) {
        const anchor_position = port._getGlobalSchematicPositionAfterLayout();
        const side =
          getEnteringEdgeFromDirection(port.facingDirection || "right") ||
          "right";
        const center = computeSchematicNetLabelCenter({
          anchor_position,
          anchor_side: side as any,
          text: label,
        });

        // // Deduplicate: if a label with the same text is already at this anchor position, skip
        const alreadyExists = db.schematic_net_label.list().some((nl) => {
          const ap = nl.anchor_position;
          if (!ap) return false;
          const samePos =
            Math.abs(ap.x - anchor_position.x) < 1e-6 &&
            Math.abs(ap.y - anchor_position.y) < 1e-6;
          return samePos && nl.text === label;
        });
        if (alreadyExists) continue;

        // @ts-ignore
        db.schematic_net_label.insert({
          text: label,
          anchor_position,
          center,
          anchor_side: side as any,
          ...(trace.source_trace_id
            ? { source_trace_id: trace.source_trace_id }
            : {}),
        });
      }
    } catch {}
  }
}
