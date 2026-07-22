import type {
  AnyCircuitElement,
  SimulationCurrentSource,
  SimulationDcVoltageSource,
  SimulationParameterSweep,
  SimulationParameterSweepPoint,
  SourceSimpleCapacitor,
  SourceSimpleInductor,
  SourceSimpleResistor,
} from "circuit-json"
import { type SpiceNetlist, circuitJsonToSpice } from "circuit-json-to-spice"

type SweepableSourceComponent =
  | SourceSimpleResistor
  | SourceSimpleCapacitor
  | SourceSimpleInductor

export interface SimulationRun {
  spiceNetlist: SpiceNetlist
  spiceString: string
  simulationParameterSweepPointId?: string
}

const getSourceComponentOrThrow = <
  SourceComponent extends SweepableSourceComponent,
>({
  circuitJson,
  sourceComponentId,
  isMatchingSourceComponent,
}: {
  circuitJson: AnyCircuitElement[]
  sourceComponentId: string
  isMatchingSourceComponent: (
    circuitElement: AnyCircuitElement,
  ) => circuitElement is SourceComponent
}) => {
  const sourceComponent = circuitJson.find(
    (circuitElement): circuitElement is SourceComponent =>
      isMatchingSourceComponent(circuitElement) &&
      circuitElement.source_component_id === sourceComponentId,
  )
  if (!sourceComponent) {
    throw new Error(`Parameter sweep target ${sourceComponentId} was not found`)
  }
  return sourceComponent
}

const applyParameterSweepPoint = ({
  circuitJson,
  parameterSweep,
  parameterValue,
  simulationParameterSweepPointId,
}: {
  circuitJson: AnyCircuitElement[]
  parameterSweep: Extract<
    AnyCircuitElement,
    { type: "simulation_parameter_sweep" }
  >
  parameterValue: number
  simulationParameterSweepPointId: string
}) => {
  const sweptCircuitJson = structuredClone(circuitJson)

  if (
    parameterSweep.parameter_type === "resistance" &&
    parameterSweep.resistor_source_component_id
  ) {
    const resistor = getSourceComponentOrThrow<SourceSimpleResistor>({
      circuitJson: sweptCircuitJson,
      sourceComponentId: parameterSweep.resistor_source_component_id,
      isMatchingSourceComponent: (
        circuitElement,
      ): circuitElement is SourceSimpleResistor =>
        circuitElement.type === "source_component" &&
        circuitElement.ftype === "simple_resistor",
    })
    resistor.resistance = parameterValue
    return sweptCircuitJson
  }

  if (
    parameterSweep.parameter_type === "capacitance" &&
    parameterSweep.capacitor_source_component_id
  ) {
    const capacitor = getSourceComponentOrThrow<SourceSimpleCapacitor>({
      circuitJson: sweptCircuitJson,
      sourceComponentId: parameterSweep.capacitor_source_component_id,
      isMatchingSourceComponent: (
        circuitElement,
      ): circuitElement is SourceSimpleCapacitor =>
        circuitElement.type === "source_component" &&
        circuitElement.ftype === "simple_capacitor",
    })
    capacitor.capacitance = parameterValue
    return sweptCircuitJson
  }

  if (
    parameterSweep.parameter_type === "inductance" &&
    parameterSweep.inductor_source_component_id
  ) {
    const inductor = getSourceComponentOrThrow<SourceSimpleInductor>({
      circuitJson: sweptCircuitJson,
      sourceComponentId: parameterSweep.inductor_source_component_id,
      isMatchingSourceComponent: (
        circuitElement,
      ): circuitElement is SourceSimpleInductor =>
        circuitElement.type === "source_component" &&
        circuitElement.ftype === "simple_inductor",
    })
    inductor.inductance = parameterValue
    return sweptCircuitJson
  }

  if (
    parameterSweep.parameter_type === "voltage" &&
    parameterSweep.source_net_id
  ) {
    const groundNet = sweptCircuitJson.find(
      (circuitElement) =>
        circuitElement.type === "source_net" &&
        circuitElement.name.toUpperCase() === "GND",
    )
    if (!groundNet || groundNet.type !== "source_net") {
      throw new Error("A voltage parameter sweep requires a GND net")
    }
    const sweepVoltageSource: SimulationDcVoltageSource = {
      type: "simulation_voltage_source",
      simulation_voltage_source_id: `simulation_voltage_source_${simulationParameterSweepPointId}`,
      is_dc_source: true,
      positive_source_net_id: parameterSweep.source_net_id,
      negative_source_net_id: groundNet.source_net_id,
      voltage: parameterValue,
    }
    sweptCircuitJson.push(sweepVoltageSource)
    return sweptCircuitJson
  }

  if (
    parameterSweep.parameter_type === "current" &&
    parameterSweep.current_source_component_id
  ) {
    const currentSourcePortIds = new Set(
      sweptCircuitJson
        .filter(
          (
            circuitElement,
          ): circuitElement is Extract<
            AnyCircuitElement,
            { type: "source_port" }
          > =>
            circuitElement.type === "source_port" &&
            circuitElement.source_component_id ===
              parameterSweep.current_source_component_id,
        )
        .map((sourcePort) => sourcePort.source_port_id),
    )
    const currentSource = sweptCircuitJson.find(
      (circuitElement): circuitElement is SimulationCurrentSource =>
        circuitElement.type === "simulation_current_source" &&
        (circuitElement.is_dc_source
          ? Boolean(
              circuitElement.positive_source_port_id &&
                currentSourcePortIds.has(
                  circuitElement.positive_source_port_id,
                ),
            )
          : Boolean(
              circuitElement.terminal1_source_port_id &&
                currentSourcePortIds.has(
                  circuitElement.terminal1_source_port_id,
                ),
            )),
    )
    if (!currentSource) {
      throw new Error(
        `Current sweep target ${parameterSweep.current_source_component_id} has no simulation source`,
      )
    }
    currentSource.current = parameterValue
    return sweptCircuitJson
  }

  throw new Error("Parameter sweep target is incomplete")
}

const createSimulationRun = ({
  circuitJson,
  simulationParameterSweepPointId,
}: {
  circuitJson: AnyCircuitElement[]
  simulationParameterSweepPointId?: string
}): SimulationRun => {
  const spiceNetlist = circuitJsonToSpice(circuitJson)
  return {
    spiceNetlist,
    spiceString: spiceNetlist.toSpiceString(),
    simulationParameterSweepPointId,
  }
}

export const createSimulationRuns = ({
  circuitJson,
  simulationExperimentId,
}: {
  circuitJson: AnyCircuitElement[]
  simulationExperimentId: string
}): SimulationRun[] => {
  const parameterSweep = circuitJson.find(
    (circuitElement): circuitElement is SimulationParameterSweep =>
      circuitElement.type === "simulation_parameter_sweep" &&
      circuitElement.simulation_experiment_id === simulationExperimentId,
  )
  if (!parameterSweep) {
    return [createSimulationRun({ circuitJson })]
  }

  return circuitJson
    .filter(
      (circuitElement): circuitElement is SimulationParameterSweepPoint =>
        circuitElement.type === "simulation_parameter_sweep_point" &&
        circuitElement.simulation_parameter_sweep_id ===
          parameterSweep.simulation_parameter_sweep_id,
    )
    .sort(
      (firstPoint, secondPoint) =>
        firstPoint.sweep_index - secondPoint.sweep_index,
    )
    .map((sweepPoint) => {
      return createSimulationRun({
        circuitJson: applyParameterSweepPoint({
          circuitJson,
          parameterSweep,
          parameterValue: sweepPoint.parameter_value,
          simulationParameterSweepPointId:
            sweepPoint.simulation_parameter_sweep_point_id,
        }),
        simulationParameterSweepPointId:
          sweepPoint.simulation_parameter_sweep_point_id,
      })
    })
}
