import { type OpAmpPinLabels, opampProps } from "@tscircuit/props"
import type { SimulationOpAmp, SourceSimpleOpAmp } from "circuit-json"
import { type BaseSymbolName, type Ftype } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

const OPAMP_COMPONENT_NAME = "OpAmp"
const OPAMP_SOURCE_FTYPE = "simple_op_amp"
const OPAMP_SYMBOL_WITH_POWER = "opamp_with_power"
const OPAMP_SYMBOL_WITHOUT_POWER = "opamp_no_power"

const OPAMP_INPUT_ALIASES = {
  pin1: ["non_inverting_input"],
  pin2: ["inverting_input"],
}

const OPAMP_POWER_ALIASES = ["positive_supply", "vcc", "vdd"]
const OPAMP_NEGATIVE_POWER_ALIASES = ["negative_supply", "vee", "vss", "gnd"]

export class OpAmp extends NormalComponent<typeof opampProps, OpAmpPinLabels> {
  getSchematicSymbolName(): BaseSymbolName {
    if (this.props.symbolName) {
      return this.props.symbolName as BaseSymbolName
    }

    const hasPowerConnections =
      this.props.connections?.positive_supply ||
      this.props.connections?.negative_supply

    if (hasPowerConnections) {
      return OPAMP_SYMBOL_WITH_POWER
    }

    return OPAMP_SYMBOL_WITHOUT_POWER
  }

  get config() {
    return {
      componentName: OPAMP_COMPONENT_NAME,
      schematicSymbolName: this.getSchematicSymbolName(),
      zodProps: opampProps,
      sourceFtype: OPAMP_SOURCE_FTYPE as Ftype,
    }
  }

  initPorts() {
    const additionalAliases = { ...OPAMP_INPUT_ALIASES }
    const hasPowerSymbol =
      this.getSchematicSymbolName() === OPAMP_SYMBOL_WITH_POWER

    if (hasPowerSymbol) {
      Object.assign(additionalAliases, {
        pin4: ["output"],
        pin5: OPAMP_POWER_ALIASES,
        pin3: OPAMP_NEGATIVE_POWER_ALIASES,
      })
    } else {
      Object.assign(additionalAliases, {
        pin3: ["output"],
        pin4: OPAMP_POWER_ALIASES,
        pin5: OPAMP_NEGATIVE_POWER_ALIASES,
      })
    }

    // opamp_with_power symbol (schematic-symbols >= 0.0.165): pin4=output, pin5=V+, pin3=V-
    // opamp_no_power symbol: pin3=output, pin4=V+, pin5=V-
    // pin4/pin5 always created so traces to positive_supply/negative_supply work on no-power variant
    super.initPorts({
      pinCount: 5,
      additionalAliases,
    })
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: OPAMP_SOURCE_FTYPE,
      name: this.name,
      supplier_part_numbers: props.supplierPartNumbers,
      display_name: props.displayName,
    } as Omit<SourceSimpleOpAmp, "source_component_id" | "type">)

    this.source_component_id = source_component.source_component_id
  }

  doInitialSimulationRender() {
    const { db } = this.root!

    const invertingInputPort = this.portMap.inverting_input
    const nonInvertingInputPort = this.portMap.non_inverting_input
    const outputPort = this.portMap.output
    const positiveSupplyPort = this.portMap.positive_supply
    const negativeSupplyPort = this.portMap.negative_supply

    if (
      !invertingInputPort?.source_port_id ||
      !nonInvertingInputPort?.source_port_id ||
      !outputPort?.source_port_id ||
      !positiveSupplyPort?.source_port_id ||
      !negativeSupplyPort?.source_port_id
    ) {
      return
    }

    db.simulation_op_amp.insert({
      type: "simulation_op_amp",
      source_component_id: this.source_component_id,
      inverting_input_source_port_id: invertingInputPort.source_port_id,
      non_inverting_input_source_port_id: nonInvertingInputPort.source_port_id,
      output_source_port_id: outputPort.source_port_id,
      positive_supply_source_port_id: positiveSupplyPort.source_port_id,
      negative_supply_source_port_id: negativeSupplyPort.source_port_id,
    } as SimulationOpAmp)
  }

  inverting_input = this.portMap.inverting_input
  non_inverting_input = this.portMap.non_inverting_input
  output = this.portMap.output
  positive_supply = this.portMap.positive_supply
  negative_supply = this.portMap.negative_supply
}
