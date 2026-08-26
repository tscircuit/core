import { resistorProps } from "@tscircuit/props"
import type { SourceSimpleResistorInput } from "circuit-json"
import { formatSiUnit } from "format-si-unit"
import type { Ftype, PassivePorts } from "lib/utils/constants"
import { symbols } from "schematic-symbols"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import { Trace } from "../primitive-components/Trace/Trace"

export class Resistor extends NormalComponent<
  typeof resistorProps,
  PassivePorts
> {
  _adjustSilkscreenTextAutomatically = true

  get config() {
    const baseSymbolName = this.props.symbolName ?? "boxresistor"
    const compactSize =
      this.props.schSize === "sm" || this.props.schSize === "xs"
        ? this.props.schSize
        : undefined
    const compactSymbolName =
      compactSize &&
      (baseSymbolName === "boxresistor" || baseSymbolName === "resistor")
        ? `${baseSymbolName}_${compactSize}`
        : undefined
    const schematicSymbolName =
      compactSymbolName && `${compactSymbolName}_right` in symbols
        ? compactSymbolName
        : baseSymbolName

    return {
      componentName: "Resistor",
      schematicSymbolName,
      zodProps: resistorProps,
      sourceFtype: "simple_resistor" as Ftype,
    }
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["anode", "pos", "left"],
        pin2: ["cathode", "neg", "right"],
      },
    })
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.resistance)}Ω`
  }

  doInitialCreateNetsFromProps() {
    this._createNetsFromProps([
      this.props.pullupFor,
      this.props.pullupTo,
      this.props.pulldownFor,
      this.props.pulldownTo,
      ...this._getNetsFromConnectionsProp(),
    ])
  }

  doInitialCreateTracesFromProps() {
    if (this.props.pullupFor && this.props.pullupTo) {
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.1`,
          to: this.props.pullupFor,
        }),
      )
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.2`,
          to: this.props.pullupTo,
        }),
      )
    }
    if (this.props.pulldownFor && this.props.pulldownTo) {
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.1`,
          to: this.props.pulldownFor,
        }),
      )
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.2`,
          to: this.props.pulldownTo,
        }),
      )
    }
    this._createTracesFromConnectionsProp()
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_resistor",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,

      resistance: props.resistance,
      display_resistance: this._getSchematicSymbolDisplayValue(),
      are_pins_interchangeable: true,
      display_name: props.displayName,
    } as SourceSimpleResistorInput)
    this.source_component_id = source_component.source_component_id
  }
}
