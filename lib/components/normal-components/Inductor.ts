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
const VALID_INDUCTANCE_UNIT_PATTERN = /^(?:[fpnuµμmkMGT]|[fpnuµμmkMGT]?[Hh])$/

const parseInductanceValue = (raw: string | number): number | null => {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0
      ? Number.parseFloat(raw.toPrecision(12))
      : null
  }

  const trimmed = raw.trim()
  if (!trimmed) return null

  if (NUMERIC_LITERAL_PATTERN.test(trimmed)) {
    const numericValue = Number(trimmed)
    return Number.isFinite(numericValue) && numericValue > 0
      ? Number.parseFloat(numericValue.toPrecision(12))
      : null
  }

  const match = trimmed.match(INDUCTANCE_WITH_UNIT_PATTERN)
  if (!match) return null

  const [, numPart, unitPart] = match
  if (!VALID_INDUCTANCE_UNIT_PATTERN.test(unitPart)) return null

  const normalizedUnit = unitPart.endsWith("h")
    ? `${unitPart.slice(0, -1)}H`
    : unitPart

  try {
    const { value, unitOfValue } = parseAndConvertSiUnit(
      `${numPart}${normalizedUnit}`,
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
  } catch {
    return null
  }

  return null
}

const validatedInductorProps = inductorProps.extend({
  inductance: z.union([z.string(), z.number()]).transform((value, ctx) => {
    const parsed = parseInductanceValue(value)
    if (parsed !== null) return parsed

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid inductance "${value}". Expected a positive number or Henry value (e.g. "10uH", "100nH")`,
    })
    return z.NEVER
  }),
})

export class Inductor extends NormalComponent<
  typeof validatedInductorProps,
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
    return `${formatSiUnit(this._parsedProps.inductance)}H`
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
