import { resistorProps } from "@tscircuit/props"
import type { SourceSimpleResistorInput } from "circuit-json"
import type { BaseSymbolName, Ftype, PassivePorts } from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import { Trace } from "../primitive-components/Trace/Trace"
import { formatSiUnit } from "format-si-unit"

const GENERIC_PASSIVE_FOOTPRINT = /^\d{4,5}$/

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

  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.resistance)}Ω`
  }

  private _getNormalizedFootprintString(): string | null {
    const footprint =
      typeof this.props.footprint === "string"
        ? this.props.footprint
        : this._getImpliedFootprintString()
    if (typeof footprint !== "string") return null
    if (!GENERIC_PASSIVE_FOOTPRINT.test(footprint)) return footprint
    return `res${footprint}`
  }

  getFootprinterString(): string | null {
    return this._getNormalizedFootprintString()
  }

  private _withNormalizedFootprint<T>(fn: () => T): T {
    const normalizedFootprint = this._getNormalizedFootprintString()
    const originalFootprint = this.props.footprint

    if (
      typeof originalFootprint !== "string" ||
      !normalizedFootprint ||
      normalizedFootprint === originalFootprint
    ) {
      return fn()
    }
    this.props.footprint = normalizedFootprint
    try {
      return fn()
    } finally {
      this.props.footprint = originalFootprint
    }
  }

  _addChildrenFromStringFootprint() {
    return this._withNormalizedFootprint(() =>
      super._addChildrenFromStringFootprint(),
    )
  }

  doInitialPcbFootprintStringRender(): void {
    this._withNormalizedFootprint(() =>
      super.doInitialPcbFootprintStringRender(),
    )
  }

  doInitialPartsEngineRender(): void {
    this._withNormalizedFootprint(() => super.doInitialPartsEngineRender())
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
