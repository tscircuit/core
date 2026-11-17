import type {
  PcbReturnCurrentExcitationProps,
  PcbTransientChannelSimulationProps,
  SimulationIbisModelProps,
  PcbReturnCurrentSimulationProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const simulation = {
  pcbtransientchannelsimulation:
    createNamespacedElement<PcbTransientChannelSimulationProps>(
      "simulation.pcbtransientchannelsimulation",
    ),
  ibismodel: createNamespacedElement<SimulationIbisModelProps>(
    "simulation.ibismodel",
  ),
  pcbreturncurrentsimulation:
    createNamespacedElement<PcbReturnCurrentSimulationProps>(
      "pcbreturncurrentsimulation",
    ),
  pcbreturncurrentexcitation:
    createNamespacedElement<PcbReturnCurrentExcitationProps>(
      "pcbreturncurrentexcitation",
    ),
} as const
