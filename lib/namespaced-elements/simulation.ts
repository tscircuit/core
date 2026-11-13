import type {
  PcbReturnCurrentExcitationProps,
  PcbTransientChannelSimulationProps,
  PcbChannelProps,
  IbisModelProps,
  PcbReturnCurrentSimulationProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const simulation = {
  pcbtransientchannelsimulation:
    createNamespacedElement<PcbTransientChannelSimulationProps>(
      "simulation.pcbtransientchannelsimulation",
    ),
  pcbchannel: createNamespacedElement<PcbChannelProps>("simulation.pcbchannel"),
  ibismodel: createNamespacedElement<
    Omit<IbisModelProps, "modelValueCorner" | "includePackageParasitics">
  >("simulation.ibismodel"),
  pcbreturncurrentsimulation:
    createNamespacedElement<PcbReturnCurrentSimulationProps>(
      "pcbreturncurrentsimulation",
    ),
  pcbreturncurrentexcitation:
    createNamespacedElement<PcbReturnCurrentExcitationProps>(
      "pcbreturncurrentexcitation",
    ),
} as const
