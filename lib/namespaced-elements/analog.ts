import type {
  AnalogAcSweepSimulationProps,
  AnalogDcOperatingPointSimulationProps,
  AnalogDcSweepSimulationProps,
  AnalogMeasurementProps,
  AnalogSweepParameterProps,
  AnalogTransientSimulationProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const analog = {
  transientsimulation: createNamespacedElement<AnalogTransientSimulationProps>(
    "analogtransientsimulation",
  ),
  dcoperatingpointsimulation:
    createNamespacedElement<AnalogDcOperatingPointSimulationProps>(
      "analogdcoperatingpointsimulation",
    ),
  dcsweepsimulation: createNamespacedElement<AnalogDcSweepSimulationProps>(
    "analogdcsweepsimulation",
  ),
  acsweepsimulation: createNamespacedElement<AnalogAcSweepSimulationProps>(
    "analogacsweepsimulation",
  ),
  sweepparameter: createNamespacedElement<AnalogSweepParameterProps>(
    "analogsweepparameter",
  ),
  measurement:
    createNamespacedElement<AnalogMeasurementProps>("analogmeasurement"),
} as const
