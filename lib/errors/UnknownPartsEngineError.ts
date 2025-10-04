import { z } from "zod"

export const unknown_parts_engine_error = z.object({
  error_type: z.literal("unknown_parts_engine_error"),
  message: z.string(),
  source_component_id: z.string(),
})

export type UnknownPartsEngineError = z.infer<typeof unknown_parts_engine_error>
