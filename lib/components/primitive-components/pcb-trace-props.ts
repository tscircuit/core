import { pcb_trace_route_point } from "circuit-json"

import { z } from "zod"

export const pcbTraceProps = z.object({
  route: z.array(pcb_trace_route_point),
  // If this primitive PcbTrace needs to be associated with a source_trace_id
  // it can be added as a prop here. For footprints, it's often not needed.
  source_trace_id: z.string().optional(),
})

export type PcbTraceProps = z.infer<typeof pcbTraceProps>
