import * as React from "react"
import { isValidElement, Children } from "react"
import type { ReactElement, ReactNode } from "react"
import { z } from "zod"
import {
  schematic_symbol,
  schematic_symbol_primitive,
  schematic_symbol_line,
  schematic_symbol_rect,
  schematic_symbol_circle,
  schematic_symbol_arc,
  schematic_symbol_text,
  type SchematicSymbol,
} from "circuit-json"
import { symbolProp } from "@tscircuit/props/lib/common/symbolProp"

// --- Add these local types ---
type NormalizeResult =
  | { symbol_name: string; symbol?: undefined }
  | { symbol: SchematicSymbol; symbol_name?: undefined }
  | {}

interface SymbolElementProps {
  /** optional name for registry/canonical use */
  name?: string
  /** viewbox hints */
  width?: number
  height?: number
  /** children are the primitive elements (<line/>, <rect/>, <text/>, etc.) */
  children?: ReactNode
}

type AnyPrimitiveElement = ReactElement<any>
// -----------------------------

function mapPrimitiveProps(kind: string, props: Record<string, any>) {
  switch (kind) {
    case "line":
      return schematic_symbol_line.parse({
        kind: "line",
        x1: +props.x1,
        y1: +props.y1,
        x2: +props.x2,
        y2: +props.y2,
        stroke_width:
          props.strokeWidth != null ? +props.strokeWidth : undefined,
      })
    case "rect":
      return schematic_symbol_rect.parse({
        kind: "rect",
        x: +props.x,
        y: +props.y,
        width: +props.width,
        height: +props.height,
        rx: props.rx != null ? +props.rx : undefined,
        ry: props.ry != null ? +props.ry : undefined,
        stroke_width:
          props.strokeWidth != null ? +props.strokeWidth : undefined,
        filled: props.filled === true,
      })
    case "circle":
      return schematic_symbol_circle.parse({
        kind: "circle",
        cx: +props.cx,
        cy: +props.cy,
        r: +props.r,
        stroke_width:
          props.strokeWidth != null ? +props.strokeWidth : undefined,
        filled: props.filled === true,
      })
    case "arc":
      return schematic_symbol_arc.parse({
        kind: "arc",
        cx: +props.cx,
        cy: +props.cy,
        r: +props.r,
        start_deg: +props.startDeg,
        end_deg: +props.endDeg,
        stroke_width:
          props.strokeWidth != null ? +props.strokeWidth : undefined,
      })
    case "text":
      return schematic_symbol_text.parse({
        kind: "text",
        x: +props.x,
        y: +props.y,
        text: String(props.text ?? props.children ?? ""),
        font_size: props.fontSize != null ? +props.fontSize : undefined,
        rotate_deg: props.rotateDeg != null ? +props.rotateDeg : undefined,
      })
    default:
      throw new Error(`Unknown <symbol> primitive: <${kind}/>`)
  }
}

/** Convert <symbol>…children…</symbol> ReactElement into a SchematicSymbol */
function reactSymbolToSchematicSymbol(el: ReactElement): SchematicSymbol {
  // Narrow the element to our known prop shape:
  const typed = el as ReactElement<SymbolElementProps>

  // Now props is properly typed (no '{}' inference):
  const props = (typed.props ?? {}) as SymbolElementProps
  const { width, height, name } = props

  const primitives: Array<z.infer<typeof schematic_symbol_primitive>> = []

  // React.Children.forEach accepts undefined just fine; with our typing, no error:
  Children.forEach(props.children, (child) => {
    if (!isValidElement(child)) return
    const childEl = child as AnyPrimitiveElement
    const kind = String(childEl.type) // intrinsic tag name like 'line', 'rect', ...
    primitives.push(mapPrimitiveProps(kind, childEl.props ?? {}))
  })

  return schematic_symbol.parse({
    name: name ?? undefined,
    width: width != null ? +width : undefined,
    height: height != null ? +height : undefined,
    primitives,
  })
}

/**
 * Normalize the external prop (string or <symbol/>) into
 * circuit-json fields (symbol_name or symbol).
 */
export function normalizeSymbolProp(input: unknown): NormalizeResult {
  if (input == null) return {}

  const ok = symbolProp.safeParse(input)
  if (!ok.success) return {}

  const value = ok.data

  if (typeof value === "string") {
    const alias = value.trim()
    return alias ? { symbol_name: alias } : {}
  }

  if (isValidElement(value)) {
    const tag = String(value.type)
    if (tag !== "symbol") {
      throw new Error(`symbol prop expects a <symbol> element; got <${tag}>`)
    }
    return { symbol: reactSymbolToSchematicSymbol(value) }
  }

  return {}
}
