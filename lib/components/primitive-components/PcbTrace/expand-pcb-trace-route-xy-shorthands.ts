import { pcbTraceProps } from "@tscircuit/props"
import type { PcbTraceRoutePoint } from "circuit-json"
import { InvalidProps } from "lib/errors/InvalidProps"
import type { z } from "zod"
import type { pcbTraceCircuitJsonInput } from "./pcb-trace-circuit-json-input"

export type PcbTraceInput =
  | z.input<typeof pcbTraceProps>
  | z.input<typeof pcbTraceCircuitJsonInput>

/**
 * Expand public XY shorthand into Circuit JSON route points in footprint-local
 * PCB mm: right-handed, +X right, +Y top, +Z above. These are points, so parent
 * placement applies translation as well as rotation/reflection after parsing.
 */
export const expandPcbTraceRouteXyShorthands = (
  input: PcbTraceInput,
): z.output<typeof pcbTraceCircuitJsonInput> => {
  const parsedInput = pcbTraceProps.safeParse(input)
  if (!parsedInput.success) {
    throw new InvalidProps("pcbtrace", input, parsedInput.error.format())
  }

  const { route, layer = "top", thickness = 0.1 } = parsedInput.data
  let currentLayer = layer
  const expandedRoute = route.map((point): PcbTraceRoutePoint => {
    if ("route_type" in point) {
      if (point.route_type === "wire") currentLayer = point.layer
      else if (point.route_type === "via") currentLayer = point.to_layer
      else currentLayer = point.end_layer
      return point
    }

    return {
      route_type: "wire",
      x: point.x,
      y: point.y,
      width: point.trace_width ?? thickness,
      layer: currentLayer,
    }
  })

  // Preserve Circuit JSON fields such as source_trace_id from internal callers.
  // The primitive validates these with its canonical Circuit JSON schema.
  return {
    route: expandedRoute,
    source_trace_id:
      "source_trace_id" in input ? input.source_trace_id : undefined,
  }
}
