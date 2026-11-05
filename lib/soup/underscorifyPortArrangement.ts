import type { SchematicComponentInput } from "circuit-json"
import type { PortArrangement } from "lib/utils/schematic/getAllDimensionsForSchematicBox"

type SideWithPins = { pins?: Array<string | number> }

const resolvePins = (
  pins: Array<string | number> | undefined,
  getPinNumber: (label: string) => number | null,
): Array<number> | undefined => {
  if (!pins) return undefined
  return pins.map((pin) => {
    if (typeof pin === "number") return pin
    const resolved = getPinNumber(pin)
    return resolved ?? (Number.parseInt(pin, 10) || 0)
  })
}

export const underscorifyPortArrangement = (
  portArrangement?: PortArrangement | undefined,
  getPinNumber: (label: string) => number | null = () => null,
): SchematicComponentInput["port_arrangement"] | undefined => {
  if (!portArrangement) return undefined
  if (
    "leftSide" in portArrangement ||
    "rightSide" in portArrangement ||
    "topSide" in portArrangement ||
    "bottomSide" in portArrangement
  ) {
    return {
      left_side: {
        ...portArrangement.leftSide,
        pins: resolvePins(
          (portArrangement as { leftSide?: SideWithPins }).leftSide?.pins,
          getPinNumber,
        ),
      },
      right_side: {
        ...portArrangement.rightSide,
        pins: resolvePins(
          (portArrangement as { rightSide?: SideWithPins }).rightSide?.pins,
          getPinNumber,
        ),
      },
      top_side: {
        ...portArrangement.topSide,
        pins: resolvePins(
          (portArrangement as { topSide?: SideWithPins }).topSide?.pins,
          getPinNumber,
        ),
      },
      bottom_side: {
        ...portArrangement.bottomSide,
        pins: resolvePins(
          (portArrangement as { bottomSide?: SideWithPins }).bottomSide?.pins,
          getPinNumber,
        ),
      },
    }
  }

  if (
    "leftPinCount" in portArrangement ||
    "rightPinCount" in portArrangement ||
    "topPinCount" in portArrangement ||
    "bottomPinCount" in portArrangement
  ) {
    return {
      left_size: portArrangement.leftPinCount!,
      right_size: portArrangement.rightPinCount!,
      top_size: portArrangement.topPinCount,
      bottom_size: portArrangement.bottomPinCount,
    }
  }

  if (
    "leftSize" in portArrangement ||
    "rightSize" in portArrangement ||
    "topSize" in portArrangement ||
    "bottomSize" in portArrangement
  ) {
    return {
      left_size: portArrangement.leftSize!,
      right_size: portArrangement.rightSize!,
      top_size: portArrangement.topSize,
      bottom_size: portArrangement.bottomSize,
    }
  }

  return undefined
}
