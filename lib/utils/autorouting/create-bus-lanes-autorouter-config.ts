import type { BusLanesPipelineOptions } from "@tscircuit/bus-lanes-solver"
import type { AutorouterConfig } from "@tscircuit/props"
import { BusLanesAutorouter } from "./BusLanesAutorouter"
import type { SimpleRouteJson } from "./SimpleRouteJson"

/** Configure bus routing in board-world mm (+X right, +Y up).
 * Connectivity mode requests copper connectivity and DRC without length matching
 * or differential coupling. Omitted options retain the matched solver goal.
 */
export function createBusLanesAutorouterConfig(
  options: BusLanesPipelineOptions = {},
): AutorouterConfig {
  const solverOptions = structuredClone(options)
  return {
    preset: "bus_lanes",
    algorithmFn: async (input: SimpleRouteJson) =>
      new BusLanesAutorouter(input, solverOptions),
  }
}
