import { WindingBreakoutInfeasibleError } from "@tscircuit/winding-breakout-point-solver"
import type { Breakout } from "./Breakout"

export const reportWindingBreakoutInfeasibleError = (
  breakout: Breakout,
  error: unknown,
): boolean => {
  if (!(error instanceof WindingBreakoutInfeasibleError)) return false
  if (!breakout.root || !breakout.pcb_group_id) return false

  const componentNames = breakout.root.db.pcb_component
    .list()
    .filter(
      (pcbComponent) => pcbComponent.pcb_group_id === breakout.pcb_group_id,
    )
    .map((pcbComponent) =>
      pcbComponent.source_component_id
        ? breakout.root!.db.source_component.get(
            pcbComponent.source_component_id,
          )?.name
        : undefined,
    )
    .filter((name): name is string => Boolean(name))

  breakout.root.db.pcb_autorouting_error.insert({
    pcb_error_id: `pcb_autorouting_error_winding_breakout_${breakout.pcb_group_id}`,
    error_type: "pcb_autorouting_error",
    message: `Winding fanout failed for ${componentNames.join(", ") || breakout.name}: ${error.message}. The connections could not escape to the breakout boundary. Give the fanout more room by increasing the breakout's padding, or by extending the breakout to include the parts crowding it (decoupling capacitors, series resistors).`,
  })
  return true
}
