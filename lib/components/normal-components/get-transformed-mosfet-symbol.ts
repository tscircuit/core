import type { MosfetProps } from "@tscircuit/props"
import { symbols, type SchSymbol, type TextPrimitive } from "schematic-symbols"

type SymbolSide = "left" | "right" | "top" | "bottom"

interface MosfetSymbolSides {
  drain: SymbolSide
  source: SymbolSide
  gate: SymbolSide
}

const sideVectors: Record<SymbolSide, { x: number; y: number }> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: 1 },
  bottom: { x: 0, y: -1 },
}

const oppositeSide: Record<SymbolSide, SymbolSide> = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
}

const possibleOrientations: MosfetSymbolSides[] = (
  Object.keys(sideVectors) as SymbolSide[]
).flatMap((gate) =>
  (Object.keys(sideVectors) as SymbolSide[])
    .filter((drain) => {
      const gateVector = sideVectors[gate]
      const drainVector = sideVectors[drain]
      return gateVector.x * drainVector.x + gateVector.y * drainVector.y === 0
    })
    .map((drain) => ({ gate, drain, source: oppositeSide[drain] })),
)

const getBaselineOrientation = (rotation: number): MosfetSymbolSides => {
  const normalizedRotation = ((rotation % 360) + 360) % 360

  if (normalizedRotation % 90 !== 0) {
    throw new Error(
      `Schematic rotation ${rotation} is not supported for Mosfet`,
    )
  }

  return [
    { gate: "left", drain: "top", source: "bottom" },
    { gate: "top", drain: "right", source: "left" },
    { gate: "right", drain: "bottom", source: "top" },
    { gate: "bottom", drain: "left", source: "right" },
  ][normalizedRotation / 90] as MosfetSymbolSides
}

const getRequestedOrientation = (props: MosfetProps): MosfetSymbolSides => {
  const requestedSides = {
    drain: props.symbolDrainSide,
    source: props.symbolSourceSide,
    gate: props.symbolGateSide,
  }
  const baseline = getBaselineOrientation(Number(props.schRotation ?? 0))
  const matchingOrientations = possibleOrientations.filter((orientation) =>
    (Object.keys(requestedSides) as Array<keyof MosfetSymbolSides>).every(
      (portName) =>
        requestedSides[portName] === undefined ||
        requestedSides[portName] === orientation[portName],
    ),
  )

  if (matchingOrientations.length === 0) {
    const requestedDescription = Object.entries(requestedSides)
      .filter(([, side]) => side !== undefined)
      .map(([portName, side]) => `${portName}=${side}`)
      .join(", ")
    throw new Error(
      `Invalid MOSFET symbol port side combination (${requestedDescription}). ` +
        "The gate must be perpendicular to the drain and source, and the drain and source must be opposite.",
    )
  }

  return matchingOrientations.sort((a, b) => {
    const score = (orientation: MosfetSymbolSides) =>
      (Object.keys(baseline) as Array<keyof MosfetSymbolSides>).filter(
        (portName) => orientation[portName] !== baseline[portName],
      ).length
    return score(a) - score(b)
  })[0]
}

const transformAnchor = (
  anchor: TextPrimitive["anchor"],
  transformVector: (point: { x: number; y: number }) => {
    x: number
    y: number
  },
): TextPrimitive["anchor"] => {
  const [vertical, horizontal] = anchor.split("_")
  const anchorVector = {
    x: horizontal === "left" ? -1 : horizontal === "right" ? 1 : 0,
    y: vertical === "top" ? 1 : vertical === "bottom" ? -1 : 0,
  }
  const transformed = transformVector(anchorVector)
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

export const getTransformedMosfetSymbol = (
  props: MosfetProps,
): SchSymbol | null => {
  const hasSymbolSideProps =
    props.symbolDrainSide !== undefined ||
    props.symbolSourceSide !== undefined ||
    props.symbolGateSide !== undefined

  if (!hasSymbolSideProps || props.symbolName || props.symbol) return null

  const mosfetMode = props.mosfetMode === "depletion" ? "d" : "e"
  const baseSymbolName =
    `${props.channelType}_channel_${mosfetMode}_mosfet_transistor_horz` as keyof typeof symbols
  const baseSymbol = symbols[baseSymbolName]
  if (!baseSymbol) return null

  const orientation = getRequestedOrientation(props)
  const gateVector = sideVectors[orientation.gate]
  const drainVector = sideVectors[orientation.drain]
  const transformVector = (point: { x: number; y: number }) => ({
    x: -gateVector.x * point.x + drainVector.x * point.y,
    y: -gateVector.y * point.x + drainVector.y * point.y,
  })
  const transformPoint = (point: { x: number; y: number }) => {
    const centeredPoint = {
      x: point.x - baseSymbol.center.x,
      y: point.y - baseSymbol.center.y,
    }
    const transformedPoint = transformVector(centeredPoint)
    return {
      x: transformedPoint.x + baseSymbol.center.x,
      y: transformedPoint.y + baseSymbol.center.y,
    }
  }
  const swapsAxes = drainVector.x !== 0

  return {
    center: { ...baseSymbol.center },
    size: swapsAxes
      ? { width: baseSymbol.size.height, height: baseSymbol.size.width }
      : { ...baseSymbol.size },
    ports: baseSymbol.ports.map((port) => ({
      ...port,
      ...transformPoint(port),
      labels: [...port.labels],
    })),
    primitives: baseSymbol.primitives.map((primitive) => {
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
          anchor: transformAnchor(primitive.anchor, transformVector),
        }
      }

      const topLeft = transformPoint({ x: primitive.x, y: primitive.y })
      return {
        ...primitive,
        x: topLeft.x,
        y: topLeft.y,
        width: swapsAxes ? primitive.height : primitive.width,
        height: swapsAxes ? primitive.width : primitive.height,
      }
    }),
  }
}
