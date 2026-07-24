import type {
  AnalogAcSweepSimulationProps,
  AnalogDcOperatingPointSimulationProps,
  AnalogDcSweepSimulationProps,
  AnalogSweepParameterProps,
  AnalogTransientSimulationProps,
} from "@tscircuit/props"
import { createElement } from "react"
import type { ReactElement } from "react"

function TransientSimulationElement(
  props: AnalogTransientSimulationProps,
): ReactElement {
  return createElement("analogtransientsimulation", props)
}

function DcOperatingPointSimulationElement(
  props: AnalogDcOperatingPointSimulationProps,
): ReactElement {
  return createElement("analogdcoperatingpointsimulation", props)
}

function DcSweepSimulationElement(
  props: AnalogDcSweepSimulationProps,
): ReactElement {
  return createElement("analogdcsweepsimulation", props)
}

function AcSweepSimulationElement(
  props: AnalogAcSweepSimulationProps,
): ReactElement {
  return createElement("analogacsweepsimulation", props)
}

function SweepParameterElement(props: AnalogSweepParameterProps): ReactElement {
  // Narrow the discriminated union so React selects the matching intrinsic
  // element overload for each parameter-specific target prop.
  switch (props.parameterType) {
    case "resistance":
      return createElement("analogsweepparameter", props)
    case "capacitance":
      return createElement("analogsweepparameter", props)
    case "inductance":
      return createElement("analogsweepparameter", props)
    case "voltage":
      return createElement("analogsweepparameter", props)
    case "current":
      return createElement("analogsweepparameter", props)
  }
}

export const analog = {
  transientsimulation: TransientSimulationElement,
  dcoperatingpointsimulation: DcOperatingPointSimulationElement,
  dcsweepsimulation: DcSweepSimulationElement,
  acsweepsimulation: AcSweepSimulationElement,
  sweepparameter: SweepParameterElement,
}
