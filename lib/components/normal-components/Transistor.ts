import {
  resolveManufacturerPartNumber,
  transistorProps,
} from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type TransistorPorts,
} from "lib/utils/constants"
import { getPinNumberFromLabels } from "lib/utils/getPortFromHints"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { Port } from "../primitive-components/Port"

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
    const pinLabels = this._resolvePinLabels()
    const hasPinLabels = Boolean(pinLabels)

    if (hasPinLabels && pinLabels) {
      const additionalAliases: Record<`pin${number}`, string[]> = {}
      for (const [pinKey, labelOrLabels] of Object.entries(pinLabels)) {
        const pinNum = Number(pinKey.replace(/\D/g, ""))
        if (!pinNum) continue
        const labels = Array.isArray(labelOrLabels)
          ? labelOrLabels
          : [labelOrLabels]
        const extra: string[] = []
        for (const l of labels) {
          const lower = l.toLowerCase()
          if (lower === "base" || lower === "b") extra.push("base", "b")
          if (lower === "collector" || lower === "c")
            extra.push("collector", "c")
          if (lower === "emitter" || lower === "e") extra.push("emitter", "e")
        }
        if (extra.length > 0) {
          additionalAliases[`pin${pinNum}`] = Array.from(new Set(extra))
        }
      }

      super.initPorts({
        pinCount: 3,
        ignoreSymbolPorts: true,
        additionalAliases,
      })

      const symbol = this.getSchematicSymbol()
      if (symbol) {
        if (this.collector) {
          this.collector.schematicSymbolPortDef =
            symbol.ports.find((p) => p.labels.includes("collector")) ?? null
        }
        if (this.base) {
          this.base.schematicSymbolPortDef =
            symbol.ports.find((p) => p.labels.includes("base")) ?? null
        }
        if (this.emitter) {
          this.emitter.schematicSymbolPortDef =
            symbol.ports.find((p) => p.labels.includes("emitter")) ?? null
        }
      }
      return
    }

    // Default pin assignment when no pinLabels provided
    const additionalAliases: Record<`pin${number}`, string[]> = {}
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
