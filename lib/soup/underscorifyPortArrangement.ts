import type { SchematicComponentInput } from "circuit-json"
import type { PortArrangement } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { getSizeOfSidesFromPortArrangement } from "lib/utils/schematic/getSizeOfSidesFromPortArrangement"

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
    const { leftSize, rightSize, topSize, bottomSize } =
      getSizeOfSidesFromPortArrangement(portArrangement)
    return {
      left_size: leftSize,
      right_size: rightSize,
      top_size: topSize,
      bottom_size: bottomSize,
    }
  }

  return undefined
}
