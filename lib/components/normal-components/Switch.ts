import {
  switchProps,
  type SwitchProps as BaseSwitchProps,
} from "@tscircuit/props"
import type { BaseSymbolName } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

type SwitchSimulationValues = {
  closesAt?: string | number
  opensAt?: string | number
  startsClosed?: boolean
  switchingFrequency?: string | number
}

type SwitchSimulationProp =
  | SwitchSimulationValues
  | { spice?: SwitchSimulationValues | null }

type SwitchPropsWithSimulation = BaseSwitchProps & {
  simulation?: SwitchSimulationProp | null
}

type SimulationSwitchRow = {
  type: "simulation_switch"
  closes_at?: string | number
  opens_at?: string | number
  starts_closed?: boolean
  switching_frequency?: string | number
}

const hasSimulationValues = (
  values: SwitchSimulationValues | null | undefined,
): values is SwitchSimulationValues => {
  if (!values) return false

  return (
    values.closesAt !== undefined ||
    values.opensAt !== undefined ||
    values.startsClosed !== undefined ||
    values.switchingFrequency !== undefined
  )
}

const isSpiceContainer = (
  simulation: SwitchSimulationProp | null | undefined,
): simulation is { spice?: SwitchSimulationValues | null } => {
  if (!simulation || typeof simulation !== "object") {
    return false
  }

  return Object.prototype.hasOwnProperty.call(simulation, "spice")
}

const getSimulationValues = (
  simulation: SwitchSimulationProp | null | undefined,
): SwitchSimulationValues | null => {
  if (!simulation || typeof simulation !== "object") {
    return null
  }

  const maybeValues = isSpiceContainer(simulation)
    ? (simulation.spice ?? null)
    : simulation

  return hasSimulationValues(maybeValues) ? { ...maybeValues } : null
}

type SwitchType = "spst" | "spdt" | "dpst" | "dpdt"

export class Switch extends NormalComponent<typeof switchProps> {
  private _getSwitchType(): SwitchType {
    const props = this._parsedProps
    if (!props) return "spst"

    if (props.dpdt) return "dpdt"
    if (props.spst) return "spst"
    if (props.spdt) return "spdt"
    if (props.dpst) return "dpst"

    return (props.type as SwitchType | undefined) ?? "spst"
  }

  get config() {
    const switchType = this._getSwitchType()
    const isNormallyClosed = this._parsedProps?.isNormallyClosed ?? false

    const symbolMap: Record<SwitchType, BaseSymbolName> = {
      spst: isNormallyClosed ? "spst_normally_closed_switch" : "spst_switch",
      spdt: isNormallyClosed ? "spdt_normally_closed_switch" : "spdt_switch",
      dpst: isNormallyClosed ? "dpst_normally_closed_switch" : "dpst_switch",
      dpdt: isNormallyClosed ? "dpdt_normally_closed_switch" : "dpdt_switch",
    }

    return {
      componentName: "Switch",
      schematicSymbolName: (this.props.symbolName ??
        symbolMap[switchType]) as BaseSymbolName,
      zodProps: switchProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const props = this._parsedProps ?? {}

    const source_component = db.source_component.insert({
      ftype: "simple_switch",
      name: this.name,
      switch_type: props.type,
      is_normally_closed: props.isNormallyClosed ?? false,
      are_pins_interchangeable: this._getSwitchType() === "spst",
    } as any)

    this.source_component_id = source_component.source_component_id
  }

  doInitialSimulationRender() {
    const props = this.props as SwitchPropsWithSimulation
    const simulationValues = getSimulationValues(props.simulation)

    if (!simulationValues) {
      return
    }

    const { db } = this.root!

    const simulationSwitch: SimulationSwitchRow = {
      type: "simulation_switch",
    }

    if (simulationValues.closesAt !== undefined) {
      simulationSwitch.closes_at = simulationValues.closesAt
    }

    if (simulationValues.opensAt !== undefined) {
      simulationSwitch.opens_at = simulationValues.opensAt
    }

    if (simulationValues.startsClosed !== undefined) {
      simulationSwitch.starts_closed = simulationValues.startsClosed
    }

    if (simulationValues.switchingFrequency !== undefined) {
      simulationSwitch.switching_frequency = simulationValues.switchingFrequency
    }
    ;(db as any).simulation_switch.insert(simulationSwitch)
  }
}
