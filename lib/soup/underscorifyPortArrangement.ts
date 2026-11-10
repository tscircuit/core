import type { SchematicComponentInput } from "circuit-json"
import type { PortArrangement } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { parsePinNumberFromLabelsOrThrow } from "lib/utils/schematic/parsePinNumberFromLabelsOrThrow"

type Side = { pins: Array<number | string>; direction?: string } | undefined

/** circuit-json stores side pins as pin numbers; props also accept labels. */
const withPinNumbers = <T extends Side>(
  side: T,
  pinLabels?: Record<string, readonly string[] | string> | null,
): T => {
  if (!side?.pins) return side
  return {
    ...side,
    pins: side.pins
      .map((pin) => {
        try {
          return parsePinNumberFromLabelsOrThrow(pin, pinLabels)
        } catch {
          if (typeof pin === "string") {
            const matchPinPrefix = /^pin(\d+)$/i.exec(pin.trim())
            if (matchPinPrefix) return Number(matchPinPrefix[1])
            const numeric = Number(pin)
            if (Number.isFinite(numeric)) return numeric
          }
          return typeof pin === "number" ? pin : undefined
        }
      })
      .filter((pin): pin is number => typeof pin === "number"),
  }
}

export const underscorifyPortArrangement = (
  portArrangement?: PortArrangement | undefined,
  pinLabels?: Record<string, readonly string[] | string> | null,
): SchematicComponentInput["port_arrangement"] | undefined => {
  if (!portArrangement) return undefined
  if (
    "leftSide" in portArrangement ||
    "rightSide" in portArrangement ||
    "topSide" in portArrangement ||
    "bottomSide" in portArrangement
  ) {
    return {
      left_side: withPinNumbers(portArrangement.leftSide, pinLabels),
      right_side: withPinNumbers(portArrangement.rightSide, pinLabels),
      top_side: withPinNumbers(portArrangement.topSide, pinLabels),
      bottom_side: withPinNumbers(portArrangement.bottomSide, pinLabels),
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
