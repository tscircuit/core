import type {
  AnalogAcSweepSimulationProps,
  AnalogDcOperatingPointSimulationProps,
  AnalogDcSweepSimulationProps,
  AnalogSweepParameterProps,
  AnalogTransientSimulationProps,
  AnalogDigitalStimulusProps,
  AnalogEyeDiagramProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const analog = {
  digitalstimulus: createNamespacedElement<AnalogDigitalStimulusProps>(
    "analogdigitalstimulus",
  ),
  eyediagram:
    createNamespacedElement<AnalogEyeDiagramProps>("analogeyediagram"),
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
} as const
