import type {
  AnyCircuitElement,
  SchematicComponent,
  SchematicNetLabel,
  SchematicText,
} from "circuit-json"
import { type Bounds, doBoundsOverlap } from "@tscircuit/math-utils"
import { getSchematicNetLabelTextWidth } from "./computeSchematicNetLabelCenter"

export type SchematicElementRef = {
  id: string
  type: "schematic_component" | "schematic_text" | "schematic_net_label"
  parentComponentId?: string
}

export type CollisionPair = {
  a: SchematicElementRef
  b: SchematicElementRef
  overlapArea: number
}

function getComponentBounds(el: SchematicComponent): Bounds | null {
  if (!el.center || !el.size) return null
  return {
    minX: el.center.x - el.size.width / 2,
    maxX: el.center.x + el.size.width / 2,
    minY: el.center.y - el.size.height / 2,
    maxY: el.center.y + el.size.height / 2,
  }
}

function getTextBounds(el: SchematicText): Bounds | null {
  if (!el.position) return null
  const charWidth = (el.font_size ?? 0.18) * 0.6
  const w = Math.max((el.text?.length ?? 0) * charWidth, 0.2)
  const h = el.font_size ?? 0.18
  const anchor = el.anchor ?? "center"
  const { x, y } = el.position

  let minX: number
  let maxX: number
  let minY: number
  let maxY: number

  if (
    anchor === "left" ||
    anchor === "center_left" ||
    anchor === "top_left" ||
    anchor === "bottom_left"
  ) {
    minX = x
    maxX = x + w
  } else if (
    anchor === "right" ||
    anchor === "center_right" ||
    anchor === "top_right" ||
    anchor === "bottom_right"
  ) {
    minX = x - w
    maxX = x
  } else {
    minX = x - w / 2
    maxX = x + w / 2
  }

  if (
    anchor === "top" ||
    anchor === "top_left" ||
    anchor === "top_right" ||
    anchor === "top_center"
  ) {
    minY = y - h
    maxY = y
  } else if (
    anchor === "bottom" ||
    anchor === "bottom_left" ||
    anchor === "bottom_right" ||
    anchor === "bottom_center"
  ) {
    minY = y
    maxY = y + h
  } else {
    minY = y - h / 2
    maxY = y + h / 2
  }

  return { minX, maxX, minY, maxY }
}

function getNetLabelBounds(el: SchematicNetLabel): Bounds | null {
  if (!el.center) return null
  const w = getSchematicNetLabelTextWidth({ text: el.text })
  const h = 0.18
  return {
    minX: el.center.x - w / 2,
    maxX: el.center.x + w / 2,
    minY: el.center.y - h / 2,
    maxY: el.center.y + h / 2,
  }
}

function getOverlapArea(a: Bounds, b: Bounds): number {
  if (!doBoundsOverlap(a, b)) return 0
  const w = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
  const h = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
  return w * h
}

type BoundsEntry = {
  ref: SchematicElementRef
  bounds: Bounds
}

type DetectSchematicCollisionsOptions = {
  includeText?: boolean
  includeNetLabels?: boolean
  minOverlapArea?: number
}

const DEFAULT_MIN_OVERLAP_AREA = 1e-9

export function getSchematicBoundsEntries(
  circuitJson: AnyCircuitElement[],
  opts: Pick<
    DetectSchematicCollisionsOptions,
    "includeText" | "includeNetLabels"
  > = {},
): BoundsEntry[] {
  const entries: BoundsEntry[] = []

  for (const el of circuitJson) {
    if (el.type === "schematic_component") {
      const bounds = getComponentBounds(el as SchematicComponent)
      if (bounds) {
        entries.push({
          ref: {
            id: (el as SchematicComponent).schematic_component_id,
            type: "schematic_component",
          },
          bounds,
        })
      }
    } else if (opts.includeText && el.type === "schematic_text") {
      const t = el as SchematicText
      const bounds = getTextBounds(t)
      if (bounds) {
        entries.push({
          ref: {
            id: t.schematic_text_id,
            type: "schematic_text",
            parentComponentId: t.schematic_component_id,
          },
          bounds,
        })
      }
    } else if (opts.includeNetLabels && el.type === "schematic_net_label") {
      const nl = el as SchematicNetLabel
      const bounds = getNetLabelBounds(nl)
      if (bounds) {
        entries.push({
          ref: {
            id: nl.schematic_net_label_id,
            type: "schematic_net_label",
          },
          bounds,
        })
      }
    }
  }

  return entries
}

export function detectSchematicCollisions(
  circuitJson: AnyCircuitElement[],
  opts: DetectSchematicCollisionsOptions = {},
): CollisionPair[] {
  const entries = getSchematicBoundsEntries(circuitJson, opts)
  const collisions: CollisionPair[] = []
  const minOverlapArea = opts.minOverlapArea ?? DEFAULT_MIN_OVERLAP_AREA

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]
      const b = entries[j]

      // skip: schematic_text vs its own parent component body
      if (
        a.ref.type === "schematic_text" &&
        b.ref.type === "schematic_component" &&
        a.ref.parentComponentId === b.ref.id
      )
        continue
      if (
        b.ref.type === "schematic_text" &&
        a.ref.type === "schematic_component" &&
        b.ref.parentComponentId === a.ref.id
      )
        continue

      // skip: two schematic_texts from same parent component
      if (
        a.ref.type === "schematic_text" &&
        b.ref.type === "schematic_text" &&
        a.ref.parentComponentId !== undefined &&
        a.ref.parentComponentId === b.ref.parentComponentId
      )
        continue

      const area = getOverlapArea(a.bounds, b.bounds)
      if (area > minOverlapArea) {
        collisions.push({ a: a.ref, b: b.ref, overlapArea: area })
      }
    }
  }

  return collisions
}
