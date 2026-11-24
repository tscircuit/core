import { inductorProps, resolveManufacturerPartNumber } from "@tscircuit/props"
import type { SourceSimpleInductor } from "circuit-json"
import { formatSiUnit, parseAndConvertSiUnit } from "format-si-unit"
import {
  type BaseSymbolName,
  FTYPE,
  type PassivePorts,
} from "lib/utils/constants"
import { z } from "zod"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"

const NUMERIC_LITERAL_PATTERN =
  /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/
const INDUCTANCE_WITH_UNIT_PATTERN =
  /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s*([^\d\s]+)$/

const validatedInductanceProp = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    if (typeof v === "number") {
      if (Number.isFinite(v) && v > 0) {
        return Number.parseFloat(v.toPrecision(12))
      }
    } else {
      const trimmed = v.trim()
      if (NUMERIC_LITERAL_PATTERN.test(trimmed)) {
        const numericValue = Number(trimmed)
        if (Number.isFinite(numericValue) && numericValue > 0) {
          return Number.parseFloat(numericValue.toPrecision(12))
        }
      } else {
        const normalized = trimmed.replace(/([pnuµμmkKMGTf])h$/, "$1H")
        const match = normalized.match(INDUCTANCE_WITH_UNIT_PATTERN)
        if (match) {
          try {
            const { value, unitOfValue } = parseAndConvertSiUnit(
              `${match[1]}${match[2]}`,
              "H",
            )
            if (
              unitOfValue === "H" &&
              typeof value === "number" &&
              Number.isFinite(value) &&
              value > 0
            ) {
              return Number.parseFloat(value.toPrecision(12))
            }
          } catch {}
        }
      }
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid inductance "${v}". Expected a positive number or Henry unit string (e.g. "10uH", "100nH")`,
    })
    return z.NEVER
  })

const validatedInductorProps = inductorProps.extend({
  inductance: validatedInductanceProp,
})

export class Inductor extends NormalComponent<
  typeof inductorProps,
  PassivePorts
> {
  _adjustSilkscreenTextAutomatically = true

  get config() {
    return {
      componentName: "Inductor",
      schematicSymbolName: (this.props.symbolName ??
        ("inductor" as BaseSymbolName)) as BaseSymbolName,
      zodProps: validatedInductorProps,
      sourceFtype: FTYPE.simple_inductor,
    }
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    const parsedInductance = this._parsedProps.inductance
    if (
      parsedInductance === undefined ||
      parsedInductance === null ||
      typeof parsedInductance !== "number" ||
      !Number.isFinite(parsedInductance)
    ) {
      return undefined
    }
    return `${formatSiUnit(parsedInductance)}H`
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["anode", "pos", "left"],
        pin2: ["cathode", "neg", "right"],
      },
    })
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: this.name,
      ftype: FTYPE.simple_inductor,
      inductance: props.inductance,
      max_current_rating:
        props.maxCurrentRating === undefined
          ? undefined
          : parseAndConvertSiUnit(props.maxCurrentRating, "A").value,
      display_inductance: this._getSchematicSymbolDisplayValue(),
      supplier_part_numbers: props.supplierPartNumbers,
      manufacturer_part_number: resolveManufacturerPartNumber(props),
      are_pins_interchangeable: true,
      display_name: props.displayName,
    } as Omit<SourceSimpleInductor, "source_component_id" | "type">)
    this.source_component_id = source_component.source_component_id
  }
}
