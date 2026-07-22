import { analogSweepParameterProps } from "@tscircuit/props"
import type { SimulationParameterUnit } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { AnalogAnalysisSimulation } from "./AnalogAnalysisSimulation"
import type { Net } from "./Net"

const parameterUnits: Record<
  "resistance" | "capacitance" | "inductance" | "voltage" | "current",
  SimulationParameterUnit
> = {
  resistance: "Ω",
  capacitance: "F",
  inductance: "H",
  voltage: "V",
  current: "A",
}

const getGeneratedParameterValues = ({
  start,
  stop,
  step,
}: {
  start: number
  stop: number
  step: number
}) => {
  const parameterValues: number[] = []
  const tolerance = Math.abs(step) * 1e-9
  const isInRange = (parameterValue: number) =>
    step > 0
      ? parameterValue <= stop + tolerance
      : parameterValue >= stop - tolerance

  for (
    let parameterValue = start;
    isInRange(parameterValue);
    parameterValue = start + parameterValues.length * step
  ) {
    parameterValues.push(parameterValue)
    if (parameterValues.length > 1_000_000) {
      throw new Error("Parameter sweep exceeds 1,000,000 points")
    }
  }
  return parameterValues
}

export class AnalogSweepParameter extends PrimitiveComponent<
  typeof analogSweepParameterProps
> {
  simulation_parameter_sweep_id: string | null = null

  get config() {
    return {
      componentName: "AnalogSweepParameter",
      zodProps: analogSweepParameterProps,
    }
  }

  doInitialSimulationRender(): void {
    if (!(this.parent instanceof AnalogAnalysisSimulation)) {
      this.renderError(
        "analog.sweepparameter must be nested directly in an analog simulation.",
      )
      return
    }

    const simulationExperiment = this.parent.getOrCreateSimulationExperiment()
    if (!simulationExperiment) return

    const props = this._parsedProps
    const parameterValues =
      props.values ??
      getGeneratedParameterValues({
        start: props.start!,
        stop: props.stop!,
        step: props.step!,
      })
    const simulationScope =
      this.parent.getGroup() ?? this.parent.getSubcircuit()
    const targetSelector =
      props.parameterType === "resistance"
        ? props.resistorRef
        : props.parameterType === "capacitance"
          ? props.capacitorRef
          : props.parameterType === "inductance"
            ? props.inductorRef
            : props.parameterType === "current"
              ? props.currentSourceRef
              : props.net
    const parameterUnit = parameterUnits[props.parameterType]

    const commonSweepFields = {
      simulation_experiment_id: simulationExperiment.simulation_experiment_id,
      name: props.name,
      parameter_type: props.parameterType,
      parameter_values: parameterValues,
      parameter_unit: parameterUnit,
    }

    let sweepId: string | null = null
    if (props.parameterType === "voltage") {
      const sweepNet = simulationScope?.selectOne<Net>(targetSelector, {
        type: "net",
      })
      if (!sweepNet?.source_net_id) {
        this.renderError(
          `Voltage sweep net "${targetSelector}" could not be resolved.`,
        )
        return
      }
      sweepId = this.root!.db.simulation_parameter_sweep.insert({
        ...commonSweepFields,
        parameter_type: "voltage",
        source_net_id: sweepNet.source_net_id,
      }).simulation_parameter_sweep_id
    } else {
      const sweepTarget = simulationScope?.selectOne(targetSelector)
      const sourceComponentId = sweepTarget?.source_component_id
      if (!sourceComponentId) {
        this.renderError(
          `Parameter sweep target "${targetSelector}" could not be resolved.`,
        )
        return
      }

      if (props.parameterType === "resistance") {
        sweepId = this.root!.db.simulation_parameter_sweep.insert({
          ...commonSweepFields,
          parameter_type: "resistance",
          resistor_source_component_id: sourceComponentId,
        }).simulation_parameter_sweep_id
      } else if (props.parameterType === "capacitance") {
        sweepId = this.root!.db.simulation_parameter_sweep.insert({
          ...commonSweepFields,
          parameter_type: "capacitance",
          capacitor_source_component_id: sourceComponentId,
        }).simulation_parameter_sweep_id
      } else if (props.parameterType === "inductance") {
        sweepId = this.root!.db.simulation_parameter_sweep.insert({
          ...commonSweepFields,
          parameter_type: "inductance",
          inductor_source_component_id: sourceComponentId,
        }).simulation_parameter_sweep_id
      } else {
        sweepId = this.root!.db.simulation_parameter_sweep.insert({
          ...commonSweepFields,
          parameter_type: "current",
          current_source_component_id: sourceComponentId,
        }).simulation_parameter_sweep_id
      }
    }

    this.simulation_parameter_sweep_id = sweepId
    for (const [sweepIndex, parameterValue] of parameterValues.entries()) {
      this.root!.db.simulation_parameter_sweep_point.insert({
        simulation_parameter_sweep_id: sweepId,
        sweep_index: sweepIndex,
        parameter_value: parameterValue,
        parameter_unit: parameterUnit,
      })
    }
  }
}
