import type { PcbReturnCurrentSimulationProps } from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const simulation = {
  pcbreturncurrentsimulation:
    createNamespacedElement<PcbReturnCurrentSimulationProps>(
      "pcbreturncurrentsimulation",
    ),
} as const
