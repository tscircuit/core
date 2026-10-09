import type {
  PcbNoiseChannelProps,
  PcbNoiseEyeProps,
  PcbNoiseSimulationProps,
  PcbReturnCurrentExcitationProps,
  PcbReturnCurrentSimulationProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const simulation = {
  pcbnoisesimulation:
    createNamespacedElement<PcbNoiseSimulationProps>("pcbnoisesimulation"),
  pcbnoisechannel:
    createNamespacedElement<PcbNoiseChannelProps>("pcbnoisechannel"),
  pcbnoiseeye: createNamespacedElement<PcbNoiseEyeProps>("pcbnoiseeye"),
  pcbreturncurrentsimulation:
    createNamespacedElement<PcbReturnCurrentSimulationProps>(
      "pcbreturncurrentsimulation",
    ),
  pcbreturncurrentexcitation:
    createNamespacedElement<PcbReturnCurrentExcitationProps>(
      "pcbreturncurrentexcitation",
    ),
} as const
