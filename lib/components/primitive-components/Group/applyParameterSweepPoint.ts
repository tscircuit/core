import type {
  AnyCircuitElement,
  SimulationCurrentSource,
  SimulationDcVoltageSource,
  SimulationParameterSweep,
  SourceSimpleCapacitor,
  SourceSimpleInductor,
  SourceSimpleResistor,
} from "circuit-json"

type SweepableSourceComponent =
  | SourceSimpleResistor
  | SourceSimpleCapacitor
  | SourceSimpleInductor

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

export const applyParameterSweepPoint = ({
  circuitJson,
  parameterSweep,
  parameterSweepCoordinate,
  simulationParameterSweepPointId,
}: {
  circuitJson: AnyCircuitElement[]
  parameterSweep: SimulationParameterSweep
  parameterSweepCoordinate: number
  simulationParameterSweepPointId: string
}): AnyCircuitElement[] => {
  const sweptCircuitJson = structuredClone(circuitJson)

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
    resistor.resistance = parameterSweepCoordinate
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
    capacitor.capacitance = parameterSweepCoordinate
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
    inductor.inductance = parameterSweepCoordinate
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
      simulation_voltage_source_id: `simulation_voltage_source_${simulationParameterSweepPointId}`,
      is_dc_source: true,
      positive_source_net_id: parameterSweep.source_net_id,
      negative_source_net_id: groundNet.source_net_id,
      voltage: parameterSweepCoordinate,
    }
    sweptCircuitJson.push(sweepVoltageSource)
    return sweptCircuitJson
  }

  if (parameterSweep.parameter_type === "current") {
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
    currentSource.current = parameterSweepCoordinate
    return sweptCircuitJson
  }

  throw new Error("Parameter sweep target is incomplete")
}
