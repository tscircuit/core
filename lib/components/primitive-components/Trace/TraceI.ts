import type { traceProps } from "@tscircuit/props";
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent";

export interface TraceI extends PrimitiveComponent<typeof traceProps> {
  source_trace_id: string | null;
  subcircuit_connectivity_map_key: string | null;
}
