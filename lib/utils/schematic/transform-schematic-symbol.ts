import type { SchSymbol, TextPrimitive } from "schematic-symbols"

export interface SchematicSymbolTransform {
  /** Clockwise rotation in degrees. Must be a multiple of 90. */
  rotation?: number
  /** Mirror left and right in the symbol's local coordinate system. */
  flipHorizontal?: boolean
  /** Mirror top and bottom in the symbol's local coordinate system. */
  flipVertical?: boolean
}

const transformTextAnchor = (
  anchor: TextPrimitive["anchor"],
  transformVector: (point: { x: number; y: number }) => {
    x: number
    y: number
  },
): TextPrimitive["anchor"] => {
  const anchorVectors: Record<
    TextPrimitive["anchor"],
    { x: number; y: number }
  > = {
    top_left: { x: -1, y: 1 },
    top_right: { x: 1, y: 1 },
    bottom_left: { x: -1, y: -1 },
    bottom_right: { x: 1, y: -1 },
    center: { x: 0, y: 0 },
    middle_top: { x: 0, y: 1 },
    middle_bottom: { x: 0, y: -1 },
    middle_left: { x: -1, y: 0 },
    middle_right: { x: 1, y: 0 },
  }
  const transformed = transformVector(anchorVectors[anchor])
  const transformedHorizontal =
    transformed.x < 0 ? "left" : transformed.x > 0 ? "right" : "middle"
  const transformedVertical =
    transformed.y > 0 ? "top" : transformed.y < 0 ? "bottom" : "middle"

  if (transformedHorizontal === "middle" && transformedVertical === "middle") {
    return "center"
  }
  if (transformedHorizontal === "middle") {
    return `middle_${transformedVertical}` as TextPrimitive["anchor"]
  }
  if (transformedVertical === "middle") {
    return `middle_${transformedHorizontal}` as TextPrimitive["anchor"]
  }
  return `${transformedVertical}_${transformedHorizontal}` as TextPrimitive["anchor"]
}

/**
 * Return a transformed copy of a schematic-symbols definition.
 *
 * Flips are applied in the symbol's local coordinate system first, followed
 * by clockwise rotation around the symbol center. The input is never mutated.
 */
export const transformSchematicSymbol = (
  symbol: SchSymbol,
  transform: SchematicSymbolTransform,
): SchSymbol => {
  const normalizedRotation = (((transform.rotation ?? 0) % 360) + 360) % 360
  if (normalizedRotation % 90 !== 0) {
    throw new Error(
      `Schematic symbol rotation ${transform.rotation} is not supported. Rotation must be a multiple of 90 degrees.`,
    )
  }

  const transformVector = (point: { x: number; y: number }) => {
    const flippedX = transform.flipHorizontal ? -point.x : point.x
    const flippedY = transform.flipVertical ? -point.y : point.y

    if (normalizedRotation === 90) return { x: flippedY, y: -flippedX }
    if (normalizedRotation === 180) return { x: -flippedX, y: -flippedY }
    if (normalizedRotation === 270) return { x: -flippedY, y: flippedX }
    return { x: flippedX, y: flippedY }
  }
  const transformPoint = (point: { x: number; y: number }) => {
    const transformed = transformVector({
      x: point.x - symbol.center.x,
      y: point.y - symbol.center.y,
    })
    return {
      x: transformed.x + symbol.center.x,
      y: transformed.y + symbol.center.y,
    }
  }
  const transformBox = (box: {
    x: number
    y: number
    width: number
    height: number
  }) => {
    const corners = [
      transformPoint({ x: box.x, y: box.y }),
      transformPoint({ x: box.x + box.width, y: box.y }),
      transformPoint({ x: box.x, y: box.y + box.height }),
      transformPoint({
        x: box.x + box.width,
        y: box.y + box.height,
      }),
    ]
    const minX = Math.min(...corners.map((point) => point.x))
    const maxX = Math.max(...corners.map((point) => point.x))
    const minY = Math.min(...corners.map((point) => point.y))
    const maxY = Math.max(...corners.map((point) => point.y))
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }
  const transformedSize = transformBox({
    x: symbol.center.x - symbol.size.width / 2,
    y: symbol.center.y - symbol.size.height / 2,
    width: symbol.size.width,
    height: symbol.size.height,
  })

  return {
    center: { ...symbol.center },
    size: {
      width: transformedSize.width,
      height: transformedSize.height,
    },
    ports: symbol.ports.map((port) => ({
      ...port,
      ...transformPoint(port),
      labels: [...port.labels],
    })),
    primitives: symbol.primitives.map((primitive) => {
      if (primitive.type === "path") {
        return {
          ...primitive,
          points: primitive.points.map(transformPoint),
        }
      }
      if (primitive.type === "circle") {
        return { ...primitive, ...transformPoint(primitive) }
      }
      if (primitive.type === "text") {
        return {
          ...primitive,
          ...transformPoint(primitive),
          anchor: transformTextAnchor(primitive.anchor, transformVector),
        }
      }
      return { ...primitive, ...transformBox(primitive) }
    }),
  }
}
