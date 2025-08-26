import { transistorProps } from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type TransistorPorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import { symbols } from "schematic-symbols"

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
      schematicSymbolName: (this.props.symbolName ??
        baseSymbolName) as BaseSymbolName,
      zodProps: transistorProps,
      sourceFtype: "simple_transistor" as Ftype,
      shouldRenderAsSchematicBox: false,
    }
  }

  initPorts() {
    const pinAliases =
      this.props.type === "npn"
        ? {
            pin1: ["emitter", "e"],
            pin2: ["collector", "c"],
            pin3: ["base", "b"],
          }
        : {
            pin1: ["collector", "c"],
            pin2: ["emitter", "e"],
            pin3: ["base", "b"],
          }

    super.initPorts({
      pinCount: 3,
      additionalAliases: pinAliases,
      ignoreSymbolPorts: true,
    })

    const symbol = symbols[this._getSchematicSymbolNameOrThrow()]
    if (!symbol) {
      throw new Error(
        `Symbol not found: ${this._getSchematicSymbolNameOrThrow()}`
      )
    }

    const findPortByLabels = (labels: string[]) =>
      symbol.ports.find((p) =>
        labels.some((label) => p.labels.includes(label))
      )

    const emitterPort = findPortByLabels(["emitter", "e"])
    const collectorPort = findPortByLabels(["collector", "c"])
    const basePort = findPortByLabels(["base", "b"])

    if (!emitterPort || !collectorPort || !basePort) {
      throw new Error(
        `Required ports not found in symbol: ${this._getSchematicSymbolNameOrThrow()}`
      )
    }

    const ports = this.selectAll("port")
    const portMap = new Map<number, Port>()

    for (const port of ports) {
      if (port.props.pinNumber) {
        portMap.set(port.props.pinNumber, port as Port)
      }
    }

    if (this.props.type === "npn") {
      portMap.get(1)!.schematicSymbolPortDef = emitterPort
      portMap.get(2)!.schematicSymbolPortDef = collectorPort
      portMap.get(3)!.schematicSymbolPortDef = basePort
    } else {
      portMap.get(1)!.schematicSymbolPortDef = collectorPort
      portMap.get(2)!.schematicSymbolPortDef = emitterPort
      portMap.get(3)!.schematicSymbolPortDef = basePort
    }
  }

  emitter = this.props.type === "npn" ? this.portMap.pin1 : this.portMap.pin2
  collector = this.props.type === "npn" ? this.portMap.pin2 : this.portMap.pin1
  base = this.portMap.pin3

  doInitialCreateNetsFromProps() {
    this._createNetsFromProps([...this._getNetsFromConnectionsProp()])
  }

  doInitialCreateTracesFromProps() {
    this._createTracesFromConnectionsProp()
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_transistor",
      name: this.name,
      transistor_type: props.type,
    } as any)

    this.source_component_id = source_component.source_component_id
  }
}
