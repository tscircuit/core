import { capacitorProps } from "@tscircuit/props"
import type { SourceSimpleCapacitorInput } from "circuit-json"
import {
  FTYPE,
  type BaseSymbolName,
  type PolarizedPassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Trace } from "../primitive-components/Trace/Trace"
import { Capacitor_getAutomaticMaxDecouplingTraceLength } from "./Capacitor_getAutomaticMaxDecouplingTraceLength"
import { formatSiUnit } from "format-si-unit"
import { getAutomaticDecouplingTraceConstraint } from "./Capacitor/get-automatic-decoupling-trace-constraint"

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

  /**
   * Apply inferred limits after routing so they remain advisory DRC warnings.
   * Explicit maxDecouplingTraceLength values remain pre-routing constraints.
   */
  doInitialPcbDesignRuleChecks(): void {
    if (this._parsedProps.maxDecouplingTraceLength !== undefined) return

    const constraint = getAutomaticDecouplingTraceConstraint(this)
    if (!constraint) return

    const { db } = this.root!
    db.source_component.update(this.source_component_id!, {
      max_decoupling_trace_length: constraint.maxLength,
    })

    for (const powerTrace of constraint.powerTraces) {
      if (!powerTrace.source_trace_id) continue

      const powerSourceTrace = db.source_trace.get(powerTrace.source_trace_id)
      if (!powerSourceTrace) continue

      db.source_trace.update(powerSourceTrace.source_trace_id, {
        max_length: Math.min(
          powerSourceTrace.max_length ?? constraint.maxLength,
          constraint.maxLength,
        ),
      })
    }
  }
}
