import type { SchematicComponentInput } from "circuit-json"
import type { PortArrangement } from "lib/utils/schematic/getAllDimensionsForSchematicBox"

export const underscorifyPortArrangement = (
  portArrangement?: PortArrangement | undefined,
): SchematicComponentInput["port_arrangement"] | undefined => {
  if (!portArrangement) return undefined

  const convertSide = (side?: {
    pins?: (number | string)[]
    direction?: "top-to-bottom" | "bottom-to-top" | "left-to-right" | "right-to-left"
  }) => {
    if (!side) return undefined
    return {
      ...side,
      pins: side.pins
        ?.map((p) => {
          if (typeof p === "number") return p
          const match = String(p).match(/^(?:pin)?(\d+)$/i)
          return match ? parseInt(match[1]!, 10) : Number(p)
        })
        .filter((n) => Number.isFinite(n)),
    }
  }

  if (
    "leftSide" in portArrangement ||
    "rightSide" in portArrangement ||
    "topSide" in portArrangement ||
    "bottomSide" in portArrangement
  ) {
    return {
      left_side: convertSide(portArrangement.leftSide as any),
      right_side: convertSide(portArrangement.rightSide as any),
      top_side: convertSide(portArrangement.topSide as any),
      bottom_side: convertSide(portArrangement.bottomSide as any),
    } as any
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
