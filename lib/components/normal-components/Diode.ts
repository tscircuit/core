import { diodeProps } from "@tscircuit/props"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import type { Port } from "../primitive-components/Port"

const getPinLabelStrings = (
  pinLabels: unknown,
  pinNumber: number,
): string[] => {
  if (!pinLabels || typeof pinLabels !== "object" || Array.isArray(pinLabels)) {
    return []
  }

  const labels = (pinLabels as Record<string, unknown>)[`pin${pinNumber}`]
  if (typeof labels === "string") return [labels]
  if (Array.isArray(labels)) {
    return labels.filter((label): label is string => typeof label === "string")
  }
  return []
}

const normalizePolarityLabel = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+-]/g, "")

const hasAnodeLabel = (labels: string[]) =>
  labels.some((label) =>
    ["a", "anode", "pos", "positive", "+"].includes(
      normalizePolarityLabel(label),
    ),
  )

const hasCathodeLabel = (labels: string[]) =>
  labels.some((label) =>
    ["k", "c", "cathode", "cat", "neg", "negative", "-"].includes(
      normalizePolarityLabel(label),
    ),
  )

const polarityAliases = new Set(["anode", "pos", "cathode", "neg"])

const removePolarityAliases = (aliases: string[] | undefined) =>
  aliases?.filter((alias) => !polarityAliases.has(alias)) ?? []

export class Diode extends NormalComponent<
  typeof diodeProps,
  PolarizedPassivePorts
> {
  get config() {
    const symbolMap: Record<string, BaseSymbolName> = {
      schottky: "schottky_diode",
      avalanche: "avalanche_diode",
      zener: "zener_diode",
      photodiode: "photodiode",
    }

    const variantSymbol = this.props.schottky
      ? "schottky"
      : this.props.avalanche
        ? "avalanche"
        : this.props.zener
          ? "zener"
          : this.props.photo
            ? "photodiode"
            : null

    return {
      schematicSymbolName: variantSymbol
        ? symbolMap[variantSymbol]
        : (this.props.symbolName ?? ("diode" as BaseSymbolName)),
      componentName: "Diode",
      zodProps: diodeProps,
      sourceFtype: "simple_diode" as Ftype,
    }
  }

  initPorts() {
    const pinLabels = (this.props as { pinLabels?: unknown }).pinLabels
    const pin1Labels = getPinLabelStrings(pinLabels, 1)
    const pin2Labels = getPinLabelStrings(pinLabels, 2)
    const pin1IsCathode = hasCathodeLabel(pin1Labels)
    const pin1IsAnode = hasAnodeLabel(pin1Labels)
    const pin2IsCathode = hasCathodeLabel(pin2Labels)
    const pin2IsAnode = hasAnodeLabel(pin2Labels)
    const isKiCadOrEasyEdaPinout =
      (pin1IsCathode || pin2IsAnode) && !(pin1IsAnode || pin2IsCathode)

    super.initPorts({
      additionalAliases: {
        pin1: isKiCadOrEasyEdaPinout
          ? ["cathode", "neg", "right"]
          : ["anode", "pos", "left"],
        pin2: isKiCadOrEasyEdaPinout
          ? ["anode", "pos", "left"]
          : ["cathode", "neg", "right"],
      },
    })

    if (pin1Labels.length > 0 || pin2Labels.length > 0) {
      this._applyImportedPolarityAliases({
        pin1Aliases: isKiCadOrEasyEdaPinout
          ? ["cathode", "neg"]
          : ["anode", "pos"],
        pin2Aliases: isKiCadOrEasyEdaPinout
          ? ["anode", "pos"]
          : ["cathode", "neg"],
        pin1Labels,
        pin2Labels,
      })
    }
  }

  private _applyImportedPolarityAliases({
    pin1Aliases,
    pin2Aliases,
    pin1Labels,
    pin2Labels,
  }: {
    pin1Aliases: string[]
    pin2Aliases: string[]
    pin1Labels: string[]
    pin2Labels: string[]
  }) {
    for (const { pinNumber, labels, aliases } of [
      { pinNumber: 1, labels: pin1Labels, aliases: pin1Aliases },
      { pinNumber: 2, labels: pin2Labels, aliases: pin2Aliases },
    ]) {
      const port = this.children.find(
        (child): child is Port =>
          child.componentName === "Port" &&
          (child as Port)._parsedProps.pinNumber === pinNumber,
      )
      if (!port) continue

      port.props.aliases = removePolarityAliases(port.props.aliases)
      port._parsedProps.aliases = removePolarityAliases(
        port._parsedProps.aliases,
      )
      port.externallyAddedAliases = removePolarityAliases(
        port.externallyAddedAliases,
      )

      for (const alias of [...labels, ...aliases]) {
        if (!port.getNameAndAliases().includes(alias)) {
          port.externallyAddedAliases.push(alias)
        }
      }
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_diode",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: false,
      display_name: props.displayName,
    } as any)
    this.source_component_id = source_component.source_component_id
  }

  get pos(): Port {
    return this.portMap.pos
  }

  get anode(): Port {
    return this.portMap.anode
  }

  get neg(): Port {
    return this.portMap.neg
  }

  get cathode(): Port {
    return this.portMap.cathode
  }
}
