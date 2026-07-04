import { diodeProps } from "@tscircuit/props"
import type { SourceSimpleDiodeInput } from "circuit-json"
import {
  type BaseSymbolName,
  type Ftype,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { isFootprinterString } from "../base-components/NormalComponent/utils/isFootprinterString"
import type { Port } from "../primitive-components/Port"

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
    const hasFootprintChild = this.children.some(
      (child) => child.componentName === "Footprint",
    )
    const footprint = this.resolveFootprint()
    const shouldAddDefaultAliases =
      !hasFootprintChild || isFootprinterString(footprint)

    super.initPorts({
      additionalAliases: {
        pin1: shouldAddDefaultAliases ? ["anode", "pos", "left"] : [],
        pin2: shouldAddDefaultAliases ? ["cathode", "neg", "right"] : [],
      },
    })
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
    } satisfies Omit<SourceSimpleDiodeInput, "type" | "source_component_id">)
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
