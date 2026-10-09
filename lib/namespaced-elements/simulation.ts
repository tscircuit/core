import type {
  PcbNoiseSimulationProps,
  PcbNoisePortProps,
  PcbNoiseExcitationProps,
  PcbNoiseTerminationProps,
  PcbNoiseObservationProps,
  PcbNoiseEyeProps,
  PcbReturnCurrentExcitationProps,
  PcbReturnCurrentSimulationProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const simulation = {
  pcbnoisesimulation:
    createNamespacedElement<PcbNoiseSimulationProps>("pcbnoisesimulation"),
  pcbnoiseport: createNamespacedElement<PcbNoisePortProps>("pcbnoiseport"),
  pcbnoiseexcitation:
    createNamespacedElement<PcbNoiseExcitationProps>("pcbnoiseexcitation"),
  pcbnoisetermination: createNamespacedElement<PcbNoiseTerminationProps>(
    "pcbnoisetermination",
  ),
  pcbnoiseobservation: createNamespacedElement<PcbNoiseObservationProps>(
    "pcbnoiseobservation",
  ),
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
