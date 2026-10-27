import {
  diodeProps,
  resolveManufacturerPartNumber,
  type PinLabelsProp,
} from "@tscircuit/props"
import type { SourceSimpleDiodeInput } from "circuit-json"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { symbols } from "schematic-symbols"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { isFootprinterString } from "../base-components/NormalComponent/utils/isFootprinterString"
import { parseFootprinterDefinition } from "lib/utils/footprints/parse-footprinter-definition"
import { resolveTwoTerminalPinMapping } from "lib/utils/footprints/resolve-two-terminal-pin-mapping"
import type { Port } from "../primitive-components/Port"

/** Diode and LED packages share A/K terminal and Footprinter artwork rules. */
export const resolveDiodeFootprint = (
  footprint: string,
  { name, pinLabels }: { name: string; pinLabels?: PinLabelsProp },
) => {
  const parsed = parseFootprinterDefinition(footprint)
  if (!parsed) return { footprint, positivePin: 1, negativePin: 2 }
  const { definition, parameters } = parsed
  const terminals = resolveTwoTerminalPinMapping({
    name,
    pinLabels,
    explicitPositive: parameters.anodepin,
    explicitNegative: parameters.cathodepin,
    positiveOption: "anodepin",
    negativeOption: "cathodepin",
    defaultPositivePin: ["do219ad", "sod323he"].includes(parameters.fn) ? 2 : 1,
  })
  let resolved = /^\d{4,5}(?=$|_|x)/.test(definition)
    ? `diode${definition}`
    : definition
  if (
    terminals.hasPolarityLabels ||
    (parameters.fn === "smdpads" && parameters.num_pins === 2)
  ) {
    if (parameters.anodepin === undefined)
      resolved += `_anodepin${terminals.positivePin}`
    if (parameters.cathodepin === undefined)
      resolved += `_cathodepin${terminals.negativePin}`
  }
  return { ...terminals, footprint: resolved }
}

export class Diode extends NormalComponent<
  typeof diodeProps,
  PolarizedPassivePorts
> {
  resolveFootprint() {
    const footprint = super.resolveFootprint()
    if (!isFootprinterString(footprint)) return footprint
    return resolveDiodeFootprint(footprint, {
      name: this.name ?? "Diode",
      pinLabels: this._resolvePinLabels(),
    }).footprint
  }

  get config() {
    const symbolMap: Record<string, BaseSymbolName> = {
      schottky: "schottky_diode",
      avalanche: "avalanche_diode",
      zener: "zener_diode",
      photodiode: "photodiode",
    }

    const variant = this.props.schottky
      ? "schottky"
      : this.props.avalanche
        ? "avalanche"
        : this.props.zener
          ? "zener"
          : this.props.photo
            ? "photo"
            : this.props.standard
              ? "standard"
              : this.props.variant
    const variantSymbol = variant === "photo" ? "photodiode" : variant

    const baseSymbolName =
      (variantSymbol && symbolMap[variantSymbol]) ||
      this.props.symbolName ||
      "diode"
    const compactSize =
      this.props.schSize === "sm" || this.props.schSize === "xs"
        ? this.props.schSize
        : undefined
    const compactSymbolName =
      compactSize &&
      (baseSymbolName === "diode" ||
        baseSymbolName === "avalanche_diode" ||
        baseSymbolName === "zener_diode")
        ? `${baseSymbolName}_${compactSize}`
        : undefined
    const schematicSymbolName =
      compactSymbolName && `${compactSymbolName}_right` in symbols
        ? compactSymbolName
        : baseSymbolName

    return {
      schematicSymbolName,
      componentName: "Diode",
      zodProps: diodeProps,
      sourceFtype: "simple_diode" as Ftype,
    }
  }

  initPorts() {
    const hasFootprintChild = this.children.some(
      (child) => child.componentName === "Footprint",
    )
    const footprint = this.resolveFootprint()
    const hasPinLabels = Boolean(this._resolvePinLabels())
    const shouldAddDefaultAliases =
      !hasPinLabels &&
      !hasFootprintChild &&
      (!footprint || isFootprinterString(footprint))

    const { positivePin, negativePin } =
      footprint && isFootprinterString(footprint)
        ? resolveDiodeFootprint(footprint, {
            name: this.name,
            pinLabels: this._resolvePinLabels(),
          })
        : { positivePin: 1, negativePin: 2 }
    super.initPorts({
      pinCount: 2,
      implicitPinLabels:
        shouldAddDefaultAliases && positivePin !== 1
          ? {
              [`pin${positivePin}`]: ["anode", "pos"],
              [`pin${negativePin}`]: ["cathode", "neg"],
            }
          : undefined,
      ignoreSymbolPorts: !hasPinLabels && !shouldAddDefaultAliases,
      additionalAliases: {
        [`pin${positivePin}`]: shouldAddDefaultAliases
          ? ["anode", "pos", positivePin === 1 ? "left" : "right"]
          : [],
        [`pin${negativePin}`]: shouldAddDefaultAliases
          ? ["cathode", "neg", negativePin === 1 ? "left" : "right"]
          : [],
      },
    })
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_diode",
      name: this.name,
      manufacturer_part_number: resolveManufacturerPartNumber(props),
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: false,
      display_name: props.displayName,
    } satisfies Omit<SourceSimpleDiodeInput, "type" | "source_component_id">)
    this.source_component_id = source_component.source_component_id
  }

  getRefDesPrefixes(): string[] {
    return ["D"]
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
