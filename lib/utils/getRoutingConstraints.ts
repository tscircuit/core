import type { busProps } from "@tscircuit/props"
import type { RoutingConstraints } from "circuit-json"
import type { z } from "zod"

/** Persist parsed author constraints. Names are resolved within a subcircuit
 * by checks; distances are already normalized to mm, impedance to ohms. */
export function getRoutingConstraints(
  intent?: z.output<typeof busProps>["pcbRoutingConstraints"],
): RoutingConstraints | undefined {
  if (!intent) return
  return {
    expected_trace_count: intent.expectedTraceCount,
    length_bounds: intent.lengthBounds && {
      reference_bus: intent.lengthBounds.referenceBus,
      reference_metric: intent.lengthBounds.referenceMetric,
      min: intent.lengthBounds.min,
      max: intent.lengthBounds.max,
    },
    spacing: intent.spacing?.map((rule) => ({
      other_bus: rule.otherBus,
      centerline_width_multiplier: rule.centerlineWidthMultiplier,
      reduced_centerline_width_multiplier:
        rule.reducedCenterlineWidthMultiplier,
    })),
    max_reduced_spacing_length: intent.maxReducedSpacingLength,
    impedance_bounds: intent.impedanceBounds,
  }
}
