import type {
  PcbReturnCurrentExcitationProps,
  PcbTransientChannelSimulationProps,
  PcbChannelProps,
  SimulationIbisModelProps,
  PcbReturnCurrentSimulationProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const simulation = {
  pcbtransientchannelsimulation:
    createNamespacedElement<PcbTransientChannelSimulationProps>(
      "simulation.pcbtransientchannelsimulation",
    ),
  pcbchannel: createNamespacedElement<PcbChannelProps>("simulation.pcbchannel"),
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
