import { switchProps, type SwitchProps } from "@tscircuit/props"
import type { BaseSymbolName } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { frequency, ms, type SimulationSwitch } from "circuit-json"

function hasSimProps(props: SwitchProps) {
  return (
    props.simSwitchFrequency !== undefined ||
    props.simCloseAt !== undefined ||
    props.simOpenAt !== undefined ||
    props.simStartClosed !== undefined ||
    props.simStartOpen !== undefined
  )
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
      are_pins_interchangeable: this._getSwitchType() === "spst",
      display_name: props?.displayName,
    })

    this.source_component_id = source_component.source_component_id
  }

  doInitialSimulationRender() {
    const { _parsedProps: props } = this

    if (!hasSimProps(props)) {
      return
    }

    const { db } = this.root!

    const simulationSwitch: Omit<SimulationSwitch, "simulation_switch_id"> = {
      type: "simulation_switch",
      source_component_id: this.source_component_id || "",
    }

    if (props.simSwitchFrequency !== undefined) {
      simulationSwitch.switching_frequency = frequency.parse(
        props.simSwitchFrequency,
      )
    }
    if (props.simCloseAt !== undefined) {
      simulationSwitch.closes_at = ms.parse(props.simCloseAt)
    }
    if (props.simOpenAt !== undefined) {
      simulationSwitch.opens_at = ms.parse(props.simOpenAt)
    }

    // simStartClosed takes precedence
    if (props.simStartOpen !== undefined) {
      simulationSwitch.starts_closed = !props.simStartOpen
    }
    if (props.simStartClosed !== undefined) {
      simulationSwitch.starts_closed = props.simStartClosed
    }
    db.simulation_switch.insert(simulationSwitch)
  }
}
