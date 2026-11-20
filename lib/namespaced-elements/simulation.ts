import type {
  PcbReturnCurrentExcitationProps,
  PcbTransientChannelSimulationProps,
  PcbDriverReceiverChannelProps,
  SimulationIbisModelProps,
  SimulationEyeDiagramProps,
  PcbReturnCurrentSimulationProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const simulation = {
  pcbtransientchannelsimulation:
    createNamespacedElement<PcbTransientChannelSimulationProps>(
      "simulation.pcbtransientchannelsimulation",
    ),
  pcbdriverreceiverchannel:
    createNamespacedElement<PcbDriverReceiverChannelProps>(
      "simulation.pcbdriverreceiverchannel",
    ),
  eyediagram: createNamespacedElement<SimulationEyeDiagramProps>(
    "simulation.eyediagram",
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
