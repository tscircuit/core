import {
  mosfetProps,
  pinLabelsProp,
  resolveManufacturerPartNumber,
} from "@tscircuit/props"
import type { BaseSymbolName, Ftype, MosfetPorts } from "lib/utils/constants"
import { getPinNumberFromLabels } from "lib/utils/getPortFromHints"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { Port } from "../primitive-components/Port"
import { getMosfetSchematicSymbolName } from "./get-mosfet-schematic-symbol-name"

const SHORT_ALIASES: Record<string, string[]> = {
  drain: ["d"],
  source: ["s"],
  gate: ["g"],
}

const mosfetComponentProps = mosfetProps.extend({
  pinLabels: pinLabelsProp.optional(),
})

export class Mosfet extends NormalComponent<
  typeof mosfetComponentProps,
  MosfetPorts
> {
  get config() {
    return {
      componentName: "Mosfet",
      schematicSymbolName: (this.props.symbolName ??
        getMosfetSchematicSymbolName(this.props)) as BaseSymbolName,
      zodProps: mosfetComponentProps,
      sourceFtype: "simple_mosfet" as Ftype,
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

  get drain(): Port {
    return this.portMap.drain
  }

  get source(): Port {
    return this.portMap.source
  }

  get gate(): Port {
    return this.portMap.gate
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
      ftype: "simple_mosfet",
      name: this.name,
      manufacturer_part_number: resolveManufacturerPartNumber(props),
      supplier_part_numbers: props.supplierPartNumbers,
      mosfet_mode: props.mosfetMode,
      channel_type: props.channelType,
      display_name: props.displayName,
    } as any)
    this.source_component_id = source_component.source_component_id
  }
}
