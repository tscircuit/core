import type { PcbBoard } from "circuit-json"

/** Boards written before the nominal width was serialized only have the minimum. */
export const getBoardNominalTraceWidth = (
  board?: (PcbBoard & { nominal_trace_width?: number }) | null,
) => board?.nominal_trace_width
