import type { NetId } from "@tscircuit/schematic-trace-solver"
import type { SourceTrace } from "circuit-json"
import type { SchematicPortId } from "./port-id-types"

export type SourceTraceId = SourceTrace["source_trace_id"]

/**
 * Exact source trace ownership for port-only solver labels created where a
 * trace crosses a schematic scope boundary.
 */
export type CrossScopeSourceTraceIdBySchematicPortIdAndNetId = Map<
  SchematicPortId,
  Map<NetId, SourceTraceId>
>
