import type { Point } from "@tscircuit/math-utils"
import type { LayerRef, PcbTrace, SourceBus } from "circuit-json"

// Use the circuit-json type when the schema is released.
export interface PcbDifferentialPairLocalSkew {
  type: "pcb_differential_pair_local_skew"
  pcb_differential_pair_local_skew_id: string
  source_bus_id: SourceBus["source_bus_id"]
  subcircuit_id?: SourceBus["subcircuit_id"]
  /** Largest known local skew on either trace, in mm. */
  max_local_skew?: number
  max_length_skew?: number
  positive: LocalSkewTrace
  negative: LocalSkewTrace
}

export interface LocalSkewTrace {
  pcb_trace_id: PcbTrace["pcb_trace_id"]
  positive_skew_scale: number
  negative_skew_scale: number
  segments: LocalSkewSegment[]
}

/** A straight piece of copper in PCB world XY (mm, +X right, +Y up, +Z above). */
export interface LocalSkewSegment {
  start: Point
  end: Point
  layer: LayerRef
  width: number
  /** This trace's length ahead of its partner at the midpoint, in mm. */
  local_skew?: number
  coupling: "coupled" | "interpolated" | "unknown"
}
