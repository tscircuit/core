import { transistorProps } from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type TransistorPorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

export class Transistor extends NormalComponent<
  typeof transistorProps,
  TransistorPorts
> {
  get config() {
    const baseSymbolName: BaseSymbolName =
      this.props.type === "npn"
        ? "npn_bipolar_transistor"
        : "pnp_bipolar_transistor"

    return {
      componentName: "Transistor",
      schematicSymbolName: baseSymbolName,
      zodProps: transistorProps,
      sourceFtype: "simple_transistor" as Ftype,
      shouldRenderAsSchematicBox: false,
    }
  }

  initPorts() {
    const pinAliases =
      this.props.type === "npn"
        ? {
            pin1: ["collector", "c"],
            pin2: ["base", "b"],
            pin3: ["emitter", "e"],
          }
        : {
            pin1: ["emitter", "e"],
            pin2: ["base", "b"],
            pin3: ["collector", "c"],
          }

    super.initPorts({
      pinCount: 3,
      additionalAliases: pinAliases,
    })
  }

  emitter = this.portMap.pin1
  base = this.portMap.pin2
  collector = this.portMap.pin3

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_transistor",
      name: props.name,
      transistor_type: props.type,
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
