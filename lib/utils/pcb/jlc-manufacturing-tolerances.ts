import type { PcbBoard } from "circuit-json"

export type JlcToleranceMap = Partial<Record<keyof PcbBoard, number>>

export const jlcMinTolerances: JlcToleranceMap = {
  min_trace_width: 0.1,
  min_via_to_via_clearance: 0.1,
  min_trace_to_pad_clearance: 0.1,
  min_pad_to_pad_clearance: 0.1,
  min_via_hole_diameter: 0.2,
  min_via_pad_diameter: 0.3,
}
