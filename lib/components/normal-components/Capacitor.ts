import { capacitorProps } from "@tscircuit/props"
import type { SourceSimpleCapacitorInput } from "circuit-json"
import { formatSiUnit } from "format-si-unit"
import {
  type BaseSymbolName,
  FTYPE,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
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
    return {
      componentName: "Capacitor",
      schematicSymbolName: this.props.polarized
        ? "capacitor_polarized"
        : (this.props.symbolName ?? ("capacitor" as BaseSymbolName)),
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
      this.props.bypassFor,
      this.props.bypassTo,
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
    if (this.props.bypassFor && this.props.bypassTo) {
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.1`,
          to: this.props.bypassFor,
        }),
      )
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.2`,
          to: this.props.bypassTo,
        }),
      )
    }
    this._createTracesFromConnectionsProp()
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    if (props.capacitance === null || !Number.isFinite(props.capacitance)) {
      this.renderError(
        `Invalid capacitance "${this.props.capacitance}" for capacitor "${this.name}". Expected a finite value (e.g. "100nF").`,
      )
      return
    }

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
