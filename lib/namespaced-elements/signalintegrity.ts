import type {
  SignalIntegritySimulationProps,
  SignalIntegritySignalProps,
  SignalIntegrityIbisModelProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const signalintegrity = {
  simulation: createNamespacedElement<SignalIntegritySimulationProps>(
    "signalintegrity.simulation",
  ),
  signal: createNamespacedElement<SignalIntegritySignalProps>(
    "signalintegrity.signal",
  ),
  ibismodel: createNamespacedElement<SignalIntegrityIbisModelProps>(
    "signalintegrity.ibismodel",
  ),
} as const
