import { getPinNumberFromLabels } from "lib/utils/getPortFromHints"
import { getRotatedSize } from "lib/utils/schematic/getRotatedSymbolName"
import { type SchSymbol, type TextPrimitive, symbols } from "schematic-symbols"
import type { SchematicSymbol } from "./SchematicSymbol"

type SymbolNinePointAnchor = TextPrimitive["anchor"]
type SymbolPrimitive = SchSymbol["primitives"][number]

export type QuarterTurnDegrees = 0 | 90 | 180 | 270

export type ResolvedSchematicSymbol =
  | {
      mode: "native"
      symbolName: keyof typeof symbols
      symbol: SchSymbol
      normalizedRotation: QuarterTurnDegrees
    }
  | {
      mode: "custom_rotated"
      symbol: SchSymbol
      normalizedRotation: QuarterTurnDegrees
    }

const OFFSET_TOLERANCE = 1e-3

const ANCHOR_CYCLE_CORNERS: readonly SymbolNinePointAnchor[] = [
  "top_left",
  "bottom_left",
  "bottom_right",
  "top_right",
]

const ANCHOR_CYCLE_EDGES: readonly SymbolNinePointAnchor[] = [
  "middle_top",
  "middle_left",
  "middle_bottom",
  "middle_right",
]

export function normalizeQuarterTurn(degrees: number): QuarterTurnDegrees {
  const normalized = ((Math.round(degrees) % 360) + 360) % 360
  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized
  }
  return 0
}

export function rotateOffsetCcw(
  dx: number,
  dy: number,
  rotation: QuarterTurnDegrees,
): { x: number; y: number } {
  switch (rotation) {
    case 90:
      return { x: -dy || 0, y: dx || 0 }
    case 180:
      return { x: -dx || 0, y: -dy || 0 }
    case 270:
      return { x: dy || 0, y: -dx || 0 }
    default:
      return { x: dx || 0, y: dy || 0 }
  }
}

function rotatePointAroundCenter(
  point: { x: number; y: number },
  center: { x: number; y: number },
  rotation: QuarterTurnDegrees,
): { x: number; y: number } {
  const rotated = rotateOffsetCcw(
    point.x - center.x,
    point.y - center.y,
    rotation,
  )
  return {
    x: center.x + rotated.x,
    y: center.y + rotated.y,
  }
}

export function rotateSymbolAnchorCcw(
  anchor: SymbolNinePointAnchor,
  rotation: QuarterTurnDegrees,
): SymbolNinePointAnchor {
  if (anchor === "center" || rotation === 0) return anchor
  const steps = rotation / 90

  const cornerIndex = ANCHOR_CYCLE_CORNERS.indexOf(anchor)
  if (cornerIndex !== -1) {
    return ANCHOR_CYCLE_CORNERS[(cornerIndex + steps) % 4]!
  }

  const edgeIndex = ANCHOR_CYCLE_EDGES.indexOf(anchor)
  if (edgeIndex !== -1) {
    return ANCHOR_CYCLE_EDGES[(edgeIndex + steps) % 4]!
  }

  return anchor
}

function doesResolvedSymbolMatchRotation(
  rawSymbol: SchSymbol,
  resolvedSymbol: SchSymbol,
  rotation: QuarterTurnDegrees,
): boolean {
  if (rawSymbol.ports.length !== resolvedSymbol.ports.length) return false

  const resolvedPortsByPin = new Map<number, SchSymbol["ports"][number]>()
  for (const resolvedPort of resolvedSymbol.ports) {
    const pinNumber = getPinNumberFromLabels(resolvedPort.labels)
    if (!pinNumber) return false
    resolvedPortsByPin.set(pinNumber, resolvedPort)
  }

  for (const rawPort of rawSymbol.ports) {
    const pinNumber = getPinNumberFromLabels(rawPort.labels)
    if (!pinNumber) return false
    const resolvedPort = resolvedPortsByPin.get(pinNumber)
    if (!resolvedPort) return false

    const expectedOffset = rotateOffsetCcw(
      rawPort.x - rawSymbol.center.x,
      rawPort.y - rawSymbol.center.y,
      rotation,
    )
    const actualDx = resolvedPort.x - resolvedSymbol.center.x
    const actualDy = resolvedPort.y - resolvedSymbol.center.y
    if (
      Math.abs(actualDx - expectedOffset.x) > OFFSET_TOLERANCE ||
      Math.abs(actualDy - expectedOffset.y) > OFFSET_TOLERANCE
    ) {
      return false
    }
  }

  const rawStaticTexts = rawSymbol.primitives.filter(
    (p): p is TextPrimitive =>
      p.type === "text" && p.text !== "{REF}" && p.text !== "{VAL}",
  )
  const resolvedStaticTexts = resolvedSymbol.primitives.filter(
    (p): p is TextPrimitive =>
      p.type === "text" && p.text !== "{REF}" && p.text !== "{VAL}",
  )
  if (rawStaticTexts.length !== resolvedStaticTexts.length) return false

  for (const rawText of rawStaticTexts) {
    const expectedOffset = rotateOffsetCcw(
      rawText.x - rawSymbol.center.x,
      rawText.y - rawSymbol.center.y,
      rotation,
    )
    const hasMatch = resolvedStaticTexts.some(
      (rt) =>
        rt.text === rawText.text &&
        Math.abs(rt.x - resolvedSymbol.center.x - expectedOffset.x) <=
          OFFSET_TOLERANCE &&
        Math.abs(rt.y - resolvedSymbol.center.y - expectedOffset.y) <=
          OFFSET_TOLERANCE,
    )
    if (!hasMatch) return false
  }

  return true
}

function rotateSymbolGeometrically(
  symbol: SchSymbol,
  rotation: QuarterTurnDegrees,
): SchSymbol {
  const { center } = symbol

  const primitives = symbol.primitives.map((primitive): SymbolPrimitive => {
    switch (primitive.type) {
      case "path":
        return {
          ...primitive,
          points: primitive.points.map((pt) =>
            rotatePointAroundCenter(pt, center, rotation),
          ),
        }
      case "circle": {
        const rotatedCenter = rotatePointAroundCenter(
          { x: primitive.x, y: primitive.y },
          center,
          rotation,
        )
        return {
          ...primitive,
          x: rotatedCenter.x,
          y: rotatedCenter.y,
        }
      }
      case "box": {
        const c1 = rotatePointAroundCenter(
          { x: primitive.x, y: primitive.y },
          center,
          rotation,
        )
        const c2 = rotatePointAroundCenter(
          {
            x: primitive.x + primitive.width,
            y: primitive.y + primitive.height,
          },
          center,
          rotation,
        )
        return {
          ...primitive,
          x: Math.min(c1.x, c2.x),
          y: Math.min(c1.y, c2.y),
          width: Math.abs(c2.x - c1.x),
          height: Math.abs(c2.y - c1.y),
        }
      }
      case "text": {
        const rotatedPos = rotatePointAroundCenter(
          { x: primitive.x, y: primitive.y },
          center,
          rotation,
        )
        return {
          ...primitive,
          x: rotatedPos.x,
          y: rotatedPos.y,
          anchor: rotateSymbolAnchorCcw(primitive.anchor, rotation),
        }
      }
    }
  })

  const ports = symbol.ports.map((port) => ({
    ...port,
    ...rotatePointAroundCenter(port, center, rotation),
  }))

  return {
    primitives,
    center: { ...center },
    ports,
    size: getRotatedSize(symbol.size, rotation),
  }
}

export function getSchematicSymbolWithRotation(
  schematicSymbol: SchematicSymbol,
): ResolvedSchematicSymbol {
  const resolvedSymbolName = schematicSymbol._getSchematicSymbolNameOrThrow()
  const resolvedSymbol = symbols[resolvedSymbolName]!
  const normalizedRotation = normalizeQuarterTurn(
    Number(schematicSymbol._parsedProps.schRotation ?? 0),
  )

  const rawSymbolName = schematicSymbol.props.symbolName as
    | keyof typeof symbols
    | undefined
  const rawSymbol =
    rawSymbolName && rawSymbolName in symbols
      ? symbols[rawSymbolName]
      : undefined

  if (normalizedRotation === 0 || !rawSymbol || !rawSymbolName) {
    return {
      mode: "native",
      symbolName: resolvedSymbolName,
      symbol: resolvedSymbol,
      normalizedRotation,
    }
  }

  const isOrientationVariantSwap =
    /_(horz|vert)$/.test(String(rawSymbolName)) &&
    (normalizedRotation === 90 || normalizedRotation === 270) &&
    resolvedSymbolName !== rawSymbolName

  if (
    isOrientationVariantSwap ||
    doesResolvedSymbolMatchRotation(
      rawSymbol,
      resolvedSymbol,
      normalizedRotation,
    )
  ) {
    return {
      mode: "native",
      symbolName: resolvedSymbolName,
      symbol: resolvedSymbol,
      normalizedRotation,
    }
  }

  return {
    mode: "custom_rotated",
    symbol: rotateSymbolGeometrically(rawSymbol, normalizedRotation),
    normalizedRotation,
  }
}
