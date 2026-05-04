import { resistorProps } from "@tscircuit/props"
import type { SourceSimpleResistorInput } from "circuit-json"
import type { BaseSymbolName, Ftype, PassivePorts } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import { Trace } from "../primitive-components/Trace/Trace"
import { formatSiUnit } from "format-si-unit"

const RESISTOR_FOOTPRINT_ALIASES = new Set([
  "01005",
  "0201",
  "0402",
  "0603",
  "0805",
  "1206",
  "1210",
  "1812",
  "2010",
  "2512",
])

export class Resistor extends NormalComponent<
  typeof resistorProps,
  PassivePorts
> {
  _adjustSilkscreenTextAutomatically = true

  get config() {
    return {
      componentName: "Resistor",
      schematicSymbolName: this.props.symbolName ?? "boxresistor",
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

  getFootprinterString(): string | null {
    const baseFootprint = super.getFootprinterString()
    if (baseFootprint && RESISTOR_FOOTPRINT_ALIASES.has(baseFootprint)) {
      return `res${baseFootprint}`
    }
    return baseFootprint
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
