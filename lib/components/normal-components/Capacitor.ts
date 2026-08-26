import { capacitorProps } from "@tscircuit/props"
import type { SourceSimpleCapacitorInput } from "circuit-json"
import { formatSiUnit } from "format-si-unit"
import {
  type BaseSymbolName,
  FTYPE,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { symbols } from "schematic-symbols"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Trace } from "../primitive-components/Trace/Trace"
import { Capacitor_getAutomaticMaxDecouplingTraceLength } from "./Capacitor_getAutomaticMaxDecouplingTraceLength"

const CAPACITOR_CHIP_FOOTPRINTS = new Set([
  "01005",
  "0201",
  "0402",
  "0603",
  "0805",
  "1206",
  "1210",
  "2010",
  "2512",
])

export class Capacitor extends NormalComponent<
  typeof capacitorProps,
  PolarizedPassivePorts
> {
  _adjustSilkscreenTextAutomatically = true
  get config() {
    const baseSymbolName = this.props.symbolName ?? "capacitor"
    const compactSize =
      this.props.schSize === "sm" || this.props.schSize === "xs"
        ? this.props.schSize
        : undefined
    const compactSymbolName =
      compactSize && baseSymbolName === "capacitor"
        ? (`capacitor_${compactSize}` as BaseSymbolName)
        : undefined
    const schematicSymbolName =
      compactSymbolName && `${compactSymbolName}_right` in symbols
        ? compactSymbolName
        : (baseSymbolName as BaseSymbolName)

    return {
      componentName: "Capacitor",
      schematicSymbolName: this.props.polarized
        ? "capacitor_polarized"
        : schematicSymbolName,
      zodProps: capacitorProps,
      sourceFtype: FTYPE.simple_capacitor,
    }
  }

  initPorts() {
    // When using footprinter strings, we automatically map pin1/pin2 to
    // anode/cathode and pos/neg (IPC standard)
    if (typeof this.props.footprint === "string") {
      super.initPorts({
        additionalAliases: {
          pin1: ["anode", "pos"],
          pin2: ["cathode", "neg"],
        },
      })
    } else {
      super.initPorts()
    }
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    const inputCapacitance = this.props.capacitance
    let capacitanceDisplay: string | undefined

    if (
      this._parsedProps.capacitance !== undefined &&
      !isNaN(this._parsedProps.capacitance)
    ) {
      capacitanceDisplay =
        typeof inputCapacitance === "string"
          ? inputCapacitance
          : `${formatSiUnit(this._parsedProps.capacitance)}F`
    } else {
      capacitanceDisplay = `${formatSiUnit(this._parsedProps.capacitance)}F`
    }

    if (
      this._parsedProps.schShowRatings &&
      this._parsedProps.maxVoltageRating
    ) {
      return `${capacitanceDisplay}/${formatSiUnit(this._parsedProps.maxVoltageRating)}V`
    }
    return capacitanceDisplay
  }

  getFootprinterString(): string | null {
    const baseFootprint = super.getFootprinterString()
    if (baseFootprint && CAPACITOR_CHIP_FOOTPRINTS.has(baseFootprint)) {
      return `cap${baseFootprint}`
    }
    return baseFootprint
  }

  doInitialCreateNetsFromProps() {
    this._createNetsFromProps([
      this.props.decouplingFor,
      this.props.decouplingTo,
      ...this._getNetsFromConnectionsProp(),
    ])
  }

  doInitialCreateTracesFromProps() {
    if (this.props.decouplingFor && this.props.decouplingTo) {
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.1`,
          to: this.props.decouplingFor,
        }),
      )
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.2`,
          to: this.props.decouplingTo,
        }),
      )
    }
    this._createTracesFromConnectionsProp()
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_capacitor",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber ?? props.mfn,
      supplier_part_numbers: props.supplierPartNumbers,
      capacitance: props.capacitance,
      max_voltage_rating: props.maxVoltageRating,
      max_decoupling_trace_length:
        props.maxDecouplingTraceLength ??
        Capacitor_getAutomaticMaxDecouplingTraceLength(this),
      display_capacitance: this._getSchematicSymbolDisplayValue(),
      are_pins_interchangeable: !props.polarized,
      display_name: props.displayName,
    } as SourceSimpleCapacitorInput)

    this.source_component_id = source_component.source_component_id
  }
}
