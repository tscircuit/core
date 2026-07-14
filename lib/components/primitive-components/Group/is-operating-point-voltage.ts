import type { AnyCircuitElementInput } from "circuit-json"

export const isOperatingPointVoltage = (
  element: AnyCircuitElementInput,
): element is Extract<
  AnyCircuitElementInput,
  { type: "simulation_operating_point_voltage" }
> => element.type === "simulation_operating_point_voltage"
