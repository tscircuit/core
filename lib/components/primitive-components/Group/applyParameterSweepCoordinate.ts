import type {
  AnyCircuitElement,
  SimulationCurrentSource,
  SimulationDcVoltageSource,
  SimulationParameterSweep,
  SimulationParameterSweepCoordinate,
  SourceSimpleCapacitor,
  SourceSimpleInductor,
  SourceSimpleResistor,
  SourcePort,
} from "circuit-json"

type SweepableSourceComponent =
  | SourceSimpleResistor
  | SourceSimpleCapacitor
  | SourceSimpleInductor
type SweepableSourceComponentId =
  SweepableSourceComponent["source_component_id"]

const getSourceComponentOrThrow = <
  SourceComponent extends SweepableSourceComponent,
>({
  circuitJson,
  sourceComponentId,
  isMatchingSourceComponent,
}: {
  circuitJson: AnyCircuitElement[]
  sourceComponentId: SweepableSourceComponentId
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

export const applyParameterSweepCoordinate = ({
  circuitJson,
  parameterSweep,
  simulationParameterSweepCoordinate,
}: {
  circuitJson: AnyCircuitElement[]
  parameterSweep: SimulationParameterSweep
  simulationParameterSweepCoordinate: SimulationParameterSweepCoordinate
}): AnyCircuitElement[] => {
  const sweptCircuitJson = structuredClone(circuitJson)
  const parameterValue = simulationParameterSweepCoordinate.parameter_value

  if (parameterSweep.parameter_type === "resistance") {
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

  if (parameterSweep.parameter_type === "capacitance") {
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

  if (parameterSweep.parameter_type === "inductance") {
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

  if (parameterSweep.parameter_type === "voltage") {
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
      simulation_voltage_source_id: `simulation_voltage_source_${simulationParameterSweepCoordinate.simulation_parameter_sweep_id}_${simulationParameterSweepCoordinate.sweep_index}`,
      is_dc_source: true,
      positive_source_net_id: parameterSweep.source_net_id,
      negative_source_net_id: groundNet.source_net_id,
      voltage: parameterValue,
    }
    sweptCircuitJson.push(sweepVoltageSource)
    return sweptCircuitJson
  }

  if (parameterSweep.parameter_type === "current") {
    const currentSourcePortIds = new Set(
      sweptCircuitJson
        .filter(
          (circuitElement): circuitElement is SourcePort =>
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
