import type { SchematicComponentInput } from "circuit-json"
import type { PortArrangement } from "lib/utils/schematic/getAllDimensionsForSchematicBox"

export const underscorifyPortArrangement = (
  portArrangement?: PortArrangement | undefined,
): SchematicComponentInput["port_arrangement"] | undefined => {
  if (!portArrangement) return undefined
  if (
    "leftSide" in portArrangement ||
    "rightSide" in portArrangement ||
    "topSide" in portArrangement ||
    "bottomSide" in portArrangement
  ) {
    return {
      left_side: portArrangement.leftSide,
      right_side: portArrangement.rightSide,
      top_side: portArrangement.topSide,
      bottom_side: portArrangement.bottomSide,
    }
  }

  if (
    "leftPinCount" in portArrangement ||
    "rightPinCount" in portArrangement ||
    "topPinCount" in portArrangement ||
    "bottomPinCount" in portArrangement ||
    "leftSize" in portArrangement ||
    "rightSize" in portArrangement ||
    "topSize" in portArrangement ||
    "bottomSize" in portArrangement
  ) {
    const pa = portArrangement as any
    return {
      left_size: pa.leftPinCount ?? pa.leftSize,
      right_size: pa.rightPinCount ?? pa.rightSize,
      top_size: pa.topPinCount ?? pa.topSize,
      bottom_size: pa.bottomPinCount ?? pa.bottomSize,
    }
  }

  return undefined
}
