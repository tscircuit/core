import type { AnyCircuitElementInput } from "circuit-json"

export const isOperatingPointCurrent = (
  element: AnyCircuitElementInput,
): element is Extract<
  AnyCircuitElementInput,
  { type: "simulation_operating_point_current" }
> => element.type === "simulation_operating_point_current"
