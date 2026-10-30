import { resolvePassiveFootprintDefinition } from "@tscircuit/footprinter"
import { capacitorProps, resolveManufacturerPartNumber } from "@tscircuit/props"
import type { SourceSimpleCapacitorInput } from "circuit-json"
import { formatSiUnit } from "format-si-unit"
import {
  type BaseSymbolName,
  FTYPE,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { symbols } from "schematic-symbols"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { parseFootprinterDefinition } from "lib/utils/footprints/parse-footprinter-definition"
import { resolveTwoTerminalPinMapping } from "lib/utils/footprints/resolve-two-terminal-pin-mapping"
import { Trace } from "../primitive-components/Trace/Trace"
import { Capacitor_getAutomaticMaxDecouplingTraceLength } from "./Capacitor_getAutomaticMaxDecouplingTraceLength"

export class Capacitor extends NormalComponent<
  typeof capacitorProps,
  PolarizedPassivePorts
> {
  _adjustSilkscreenTextAutomatically = true
  resolveFootprint() {
    const footprint = super.resolveFootprint()
    return typeof footprint === "string"
      ? this.getFootprinterString()
      : footprint
  }

  getFootprinterString(): string | null {
    // Read the authored definition directly: the base CAD getter calls resolveFootprint.
    const footprint = super.resolveFootprint()
    if (typeof footprint !== "string") return null
    const parsed = parseFootprinterDefinition(footprint)
    if (!parsed) return footprint
    const { definition, parameters } = parsed
    const terminals = resolveTwoTerminalPinMapping({
      name: this.name ?? "Capacitor",
      pinLabels: this._resolvePinLabels(),
      explicitPositive: parameters.positivepin,
      explicitNegative: parameters.negativepin,
      positiveOption: "positivepin",
      negativeOption: "negativepin",
    })
    const polarized = this._parsedProps.polarized
    if (
      polarized &&
      (parameters.nonpolarized ||
        parameters.polarized === false ||
        parameters.polarized === "false")
    ) {
      throw new Error(
        `${this.name} is polarized but its footprint explicitly disables polarity.`,
      )
    }
    let resolved = resolvePassiveFootprintDefinition(definition, {
      defaultFamily: "cap",
    })
    if (
      parameters.polarized === undefined &&
      parameters.nonpolarized === undefined
    ) {
      resolved += polarized ? "_polarized" : "_nonpolarized"
    }
    if (terminals.hasPolarityLabels) {
      if (parameters.positivepin === undefined)
        resolved += `_positivepin${terminals.positivePin}`
      if (parameters.negativepin === undefined)
        resolved += `_negativepin${terminals.negativePin}`
    }
    return resolved
  }

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
    // Keep electrical polarity aliases aligned with footprint terminal options.
    if (typeof this.props.footprint === "string") {
      const parsed = parseFootprinterDefinition(this.props.footprint)
      const { positivePin, negativePin } = parsed
        ? resolveTwoTerminalPinMapping({
            name: this.name,
            pinLabels: this._resolvePinLabels(),
            explicitPositive: parsed.parameters.positivepin,
            explicitNegative: parsed.parameters.negativepin,
            positiveOption: "positivepin",
            negativeOption: "negativepin",
          })
        : { positivePin: 1, negativePin: 2 }
      super.initPorts({
        implicitPinLabels:
          positivePin !== 1
            ? {
                [`pin${positivePin}`]: ["anode", "pos"],
                [`pin${negativePin}`]: ["cathode", "neg"],
              }
            : undefined,
        additionalAliases: {
          [`pin${positivePin}`]: ["anode", "pos"],
          [`pin${negativePin}`]: ["cathode", "neg"],
        },
      })
    } else {
      super.initPorts()
    }
  }

  private _getCapacitanceDisplayValue(): string | undefined {
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

    return capacitanceDisplay
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    const capacitanceDisplay = this._getCapacitanceDisplayValue()
    if (
      this._parsedProps.schShowRatings &&
      this._parsedProps.maxVoltageRating
    ) {
      return `${capacitanceDisplay}/${formatSiUnit(this._parsedProps.maxVoltageRating)}V`
    }
    return capacitanceDisplay
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
      manufacturer_part_number: resolveManufacturerPartNumber(props),
      supplier_part_numbers: props.supplierPartNumbers,
      capacitance: props.capacitance,
      max_voltage_rating: props.maxVoltageRating,
      max_decoupling_trace_length:
        props.maxDecouplingTraceLength ??
        Capacitor_getAutomaticMaxDecouplingTraceLength(this),
      display_capacitance: this._getCapacitanceDisplayValue(),
      display_max_voltage_rating:
        props.maxVoltageRating === undefined
          ? undefined
          : `${formatSiUnit(props.maxVoltageRating)}V`,
      are_pins_interchangeable: !props.polarized,
      display_name: props.displayName,
    } satisfies SourceSimpleCapacitorInput)

    this.source_component_id = source_component.source_component_id
  }
}
