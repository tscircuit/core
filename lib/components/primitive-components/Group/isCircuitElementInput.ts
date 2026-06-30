import type { AnyCircuitElementInput } from "circuit-json"

export const isCircuitElementInput = (
  element: unknown,
): element is AnyCircuitElementInput =>
  Boolean(element && typeof element === "object" && "type" in element)
