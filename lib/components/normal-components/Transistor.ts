import {
  pinLabelsProp,
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

// @tscircuit/props' transistorProps doesn't declare pinLabels, so zod would
// strip it. Accept it here so SOT-23 style B/E/C pin orders can be remapped.
const transistorPropsWithPinLabels = transistorProps.extend({
  pinLabels: pinLabelsProp.optional(),
})

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
      zodProps: transistorPropsWithPinLabels,
      sourceFtype: "simple_transistor" as Ftype,
      shouldRenderAsSchematicBox: false,
    }
  }

  initPorts() {
    // Pin roles come from the schematic symbol's named port labels
    // (e.g. [["1","collector"],["2","base"],["3","emitter"]]) rather than a
    // hardcoded pin-number map; only short aliases ("c"/"b"/"e") are added
    // here, attached to whichever pin the symbol labels with the long name.
    const additionalAliases: Record<`pin${number}`, string[]> = {}
    const pinLabels = this._resolvePinLabels()
    if (pinLabels) {
      // User-provided labels (e.g. SOT-23: pin1 base, pin2 emitter, pin3
      // collector) decide which pin gets each short alias.
      for (const [pinKey, label] of Object.entries(pinLabels)) {
        const shortAliases = (Array.isArray(label) ? label : [label]).flatMap(
          (l) => SHORT_ALIASES[l] ?? [],
        )
        if (shortAliases.length > 0) {
          additionalAliases[pinKey as `pin${number}`] = shortAliases
        }
      }
    } else {
      const symbol = this.getSchematicSymbol()
      for (const symPort of symbol?.ports ?? []) {
        const pinNumber = getPinNumberFromLabels(symPort.labels)
        if (!pinNumber) continue
        for (const label of symPort.labels) {
          const shortAliases = SHORT_ALIASES[label]
          if (shortAliases) {
            additionalAliases[`pin${pinNumber}`] = shortAliases
          }
        }
      }
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
