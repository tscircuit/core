import { diodeProps, resolveManufacturerPartNumber } from "@tscircuit/props"
import type { SourceSimpleDiodeInput } from "circuit-json"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { symbols } from "schematic-symbols"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { isFootprinterString } from "../base-components/NormalComponent/utils/isFootprinterString"
import { getDiodePortOptions } from "lib/utils/footprints/get-diode-port-options"
import { resolveDiodeFootprint } from "lib/utils/footprints/resolve-diode-footprint"
import type { Port } from "../primitive-components/Port"

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
    super.initPorts(getDiodePortOptions(this))
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
