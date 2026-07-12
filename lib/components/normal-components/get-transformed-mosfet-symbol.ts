import type { MosfetProps } from "@tscircuit/props"
import { transformSchematicSymbol } from "lib/utils/schematic/transform-schematic-symbol"
import { symbols, type SchSymbol } from "schematic-symbols"

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
  const rotationByGateSide: Record<SymbolSide, number> = {
    left: 0,
    top: 90,
    right: 180,
    bottom: 270,
  }
  const unflippedDrainSideByGateSide: Record<SymbolSide, SymbolSide> = {
    left: "top",
    top: "right",
    right: "bottom",
    bottom: "left",
  }

  return transformSchematicSymbol(baseSymbol, {
    rotation: rotationByGateSide[orientation.gate],
    flipVertical:
      orientation.drain !== unflippedDrainSideByGateSide[orientation.gate],
  })
}
