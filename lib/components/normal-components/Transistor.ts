import {
  transistorProps,
  resolveManufacturerPartNumber,
} from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type TransistorPorts,
} from "lib/utils/constants"
import { getPinNumberFromLabels } from "lib/utils/getPortFromHints"
import type { Port } from "../primitive-components/Port"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

const SHORT_ALIASES: Record<string, string[]> = {
  collector: ["c"],
  base: ["b"],
  emitter: ["e"],
}

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
    // Explicit labels describe physical package pins. Symbol pin numbers are
    // only the fallback; short aliases must follow the selected semantic role.
    const additionalAliases: Record<`pin${number}`, string[]> = {}
    const pinLabels = this._resolvePinLabels()
    const portLabels = pinLabels
      ? Object.entries(pinLabels).map(([pin, labels]) => [
          pin,
          ...(Array.isArray(labels) ? labels : [labels]),
        ])
      : (this.getSchematicSymbol()?.ports.map((port) => port.labels) ?? [])
    for (const labels of portLabels) {
      const pinNumber = getPinNumberFromLabels(labels)
      if (!pinNumber) continue
      additionalAliases[`pin${pinNumber}`] = labels.flatMap(
        (label) => SHORT_ALIASES[label] ?? [],
      )
    }

    super.initPorts({
      pinCount: 3,
      additionalAliases,
    })
  }

  get collector(): Port {
    return this.portMap.collector
  }

  get base(): Port {
    return this.portMap.base
  }

  get emitter(): Port {
    return this.portMap.emitter
  }

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
      manufacturer_part_number: resolveManufacturerPartNumber(props),
      supplier_part_numbers: props.supplierPartNumbers,
      transistor_type: props.type,
      display_name: props.displayName,
    } as any)

    this.source_component_id = source_component.source_component_id
  }
}
