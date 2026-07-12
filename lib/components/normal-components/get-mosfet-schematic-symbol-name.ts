import type { MosfetProps } from "@tscircuit/props"
import type { BaseSymbolName } from "lib/utils/constants"

type SymbolSide = "left" | "right" | "top" | "bottom"

interface MosfetSymbolSides {
  drain: SymbolSide
  source: SymbolSide
  gate: SymbolSide
}

const possibleOrientations: MosfetSymbolSides[] = [
  { gate: "left", drain: "top", source: "bottom" },
  { gate: "left", drain: "bottom", source: "top" },
  { gate: "right", drain: "top", source: "bottom" },
  { gate: "right", drain: "bottom", source: "top" },
  { gate: "top", drain: "left", source: "right" },
  { gate: "top", drain: "right", source: "left" },
  { gate: "bottom", drain: "left", source: "right" },
  { gate: "bottom", drain: "right", source: "left" },
]

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

export const getMosfetSchematicSymbolName = (
  props: MosfetProps,
): BaseSymbolName => {
  const mosfetMode = props.mosfetMode === "depletion" ? "d" : "e"
  const baseSymbolName = `${props.channelType}_channel_${mosfetMode}_mosfet_transistor`
  const hasSymbolSideProps =
    props.symbolDrainSide !== undefined ||
    props.symbolSourceSide !== undefined ||
    props.symbolGateSide !== undefined

  if (!hasSymbolSideProps) return baseSymbolName as BaseSymbolName

  const { gate, drain } = getRequestedOrientation(props)
  return `${baseSymbolName}_gate_${gate}_drain_${drain}` as BaseSymbolName
}
