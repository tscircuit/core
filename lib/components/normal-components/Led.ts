import { ledProps } from "@tscircuit/props"
import type {
  BaseSymbolName,
  Ftype,
  PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { isFootprinterString } from "../base-components/NormalComponent/utils/isFootprinterString"
import type { Port } from "../primitive-components/Port"

export class Led extends NormalComponent<
  typeof ledProps,
  PolarizedPassivePorts
> {
  get config() {
    const symbolMap: Record<string, BaseSymbolName> = {
      laser: "laser_diode",
    }

    const variantSymbol = this.props.laser ? "laser" : null

    return {
      schematicSymbolName: variantSymbol
        ? symbolMap[variantSymbol]
        : (this.props.symbolName ?? ("led" as BaseSymbolName)),
      componentName: "Led",
      zodProps: ledProps,
      sourceFtype: "simple_led" as Ftype,
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

    super.initPorts({
      pinCount: 2,
      ignoreSymbolPorts: !hasPinLabels && !shouldAddDefaultAliases,
      additionalAliases: {
        pin1: shouldAddDefaultAliases ? ["anode", "pos", "left"] : [],
        pin2: shouldAddDefaultAliases ? ["cathode", "neg", "right"] : [],
      },
    })
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return (
      this._parsedProps.schDisplayValue || this._parsedProps.color || undefined
    )
  }

  getFootprinterString(): string | null {
    const baseFootprint = super.getFootprinterString()
    if (baseFootprint && this.props.color) {
      return `${baseFootprint}_color(${this.props.color})`
    }
    return baseFootprint
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_led",
      name: this.name,
      wave_length: props.wavelength,
      color: props.color,
      symbol_display_value: this._getSchematicSymbolDisplayValue(),
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
