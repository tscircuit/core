import type { traceProps } from "@tscircuit/props"
import type { z } from "zod"
import { Trace } from "./Trace"

export function createSynthesizedTrace(
  props: z.input<typeof traceProps>,
): Trace {
  const trace = new Trace(props)
  trace._isSynthesizedFromProps = true
  return trace
}
