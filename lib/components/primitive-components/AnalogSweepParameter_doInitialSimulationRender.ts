import type { AnalogSweepParameterProps } from "@tscircuit/props"
import type {
  SimulationParameterSweep,
  SimulationParameterType,
  SimulationParameterUnit,
} from "circuit-json"
import { AnalogAnalysisSimulation } from "./AnalogAnalysisSimulation"
import type { AnalogSweepParameter } from "./AnalogSweepParameter"
import type { Net } from "./Net"

type SimulationParameterSweepId =
  SimulationParameterSweep["simulation_parameter_sweep_id"]

const parameterUnits: Record<SimulationParameterType, SimulationParameterUnit> =
  {
    resistance: "Ω",
    capacitance: "F",
    inductance: "H",
    voltage: "V",
    current: "A",
  }

const isParameterSweepCoordinateInRange = ({
  parameterSweepCoordinate,
  stop,
  step,
}: {
  parameterSweepCoordinate: number
  stop: number
  step: number
}) => {
  const tolerance = Math.abs(step) * 1e-9
  return step > 0
    ? parameterSweepCoordinate <= stop + tolerance
    : parameterSweepCoordinate >= stop - tolerance
}

const getGeneratedParameterSweepCoordinates = ({
  start,
  stop,
  step,
}: {
  start: number
  stop: number
  step: number
}) => {
  const parameterSweepCoordinates: number[] = []

  for (
    let parameterSweepCoordinate = start;
    isParameterSweepCoordinateInRange({
      parameterSweepCoordinate,
      stop,
      step,
    });
    parameterSweepCoordinate = start + parameterSweepCoordinates.length * step
  ) {
    parameterSweepCoordinates.push(parameterSweepCoordinate)
    if (parameterSweepCoordinates.length > 1_000_000) {
      throw new Error("Parameter sweep exceeds 1,000,000 points")
    }
  }

  return parameterSweepCoordinates
}

const getParameterSweepTargetSelector = (
  props: AnalogSweepParameterProps,
): string => {
  switch (props.parameterType) {
    case "resistance":
      return props.resistorRef
    case "capacitance":
      return props.capacitorRef
    case "inductance":
      return props.inductorRef
    case "voltage":
      return props.net
    case "current":
      return props.currentSourceRef
  }
}

export const AnalogSweepParameter_doInitialSimulationRender = (
  analogSweepParameter: AnalogSweepParameter,
): void => {
  if (!(analogSweepParameter.parent instanceof AnalogAnalysisSimulation)) {
    analogSweepParameter.renderError(
      "analog.sweepparameter must be nested directly in an analog simulation.",
    )
    return
  }

  const simulationExperiment =
    analogSweepParameter.parent.getOrCreateSimulationExperiment()
  if (!simulationExperiment) return

  const props = analogSweepParameter._parsedProps
  const parameterSweepCoordinates =
    props.values ??
    getGeneratedParameterSweepCoordinates({
      start: props.start!,
      stop: props.stop!,
      step: props.step!,
    })
  const simulationScope =
    analogSweepParameter.parent.getGroup() ??
    analogSweepParameter.parent.getSubcircuit()
  const targetSelector = getParameterSweepTargetSelector(props)
  const parameterUnit = parameterUnits[props.parameterType]
  const simulationParameterSweepTable =
    analogSweepParameter.root!.db.simulation_parameter_sweep
  const simulationParameterSweepFields = {
    simulation_experiment_id: simulationExperiment.simulation_experiment_id,
    name: props.name,
    parameter_type: props.parameterType,
    parameter_values: parameterSweepCoordinates,
    parameter_unit: parameterUnit,
  }

  let simulationParameterSweepId: SimulationParameterSweepId
  if (props.parameterType === "voltage") {
    const sweepNet = simulationScope?.selectOne<Net>(targetSelector, {
      type: "net",
    })
    if (!sweepNet?.source_net_id) {
      analogSweepParameter.renderError(
        `Voltage sweep net "${targetSelector}" could not be resolved.`,
      )
      return
    }
    simulationParameterSweepId = simulationParameterSweepTable.insert({
      ...simulationParameterSweepFields,
      parameter_type: "voltage",
      source_net_id: sweepNet.source_net_id,
    }).simulation_parameter_sweep_id
  } else {
    const sweepTarget = simulationScope?.selectOne(targetSelector)
    const sourceComponentId = sweepTarget?.source_component_id
    if (!sourceComponentId) {
      analogSweepParameter.renderError(
        `Parameter sweep target "${targetSelector}" could not be resolved.`,
      )
      return
    }

    if (props.parameterType === "resistance") {
      simulationParameterSweepId = simulationParameterSweepTable.insert({
        ...simulationParameterSweepFields,
        parameter_type: "resistance",
        resistor_source_component_id: sourceComponentId,
      }).simulation_parameter_sweep_id
    } else if (props.parameterType === "capacitance") {
      simulationParameterSweepId = simulationParameterSweepTable.insert({
        ...simulationParameterSweepFields,
        parameter_type: "capacitance",
        capacitor_source_component_id: sourceComponentId,
      }).simulation_parameter_sweep_id
    } else if (props.parameterType === "inductance") {
      simulationParameterSweepId = simulationParameterSweepTable.insert({
        ...simulationParameterSweepFields,
        parameter_type: "inductance",
        inductor_source_component_id: sourceComponentId,
      }).simulation_parameter_sweep_id
    } else {
      simulationParameterSweepId = simulationParameterSweepTable.insert({
        ...simulationParameterSweepFields,
        parameter_type: "current",
        current_source_component_id: sourceComponentId,
      }).simulation_parameter_sweep_id
    }
  }

  analogSweepParameter.simulation_parameter_sweep_id =
    simulationParameterSweepId
  for (const [
    sweepIndex,
    parameterSweepCoordinate,
  ] of parameterSweepCoordinates.entries()) {
    analogSweepParameter.root!.db.simulation_parameter_sweep_point.insert({
      simulation_parameter_sweep_id: simulationParameterSweepId,
      sweep_index: sweepIndex,
      parameter_value: parameterSweepCoordinate,
      parameter_unit: parameterUnit,
    })
  }
}
