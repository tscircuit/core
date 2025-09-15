import type { SchematicComponentInput } from "circuit-json";
import type { PortArrangement } from "lib/utils/schematic/getAllDimensionsForSchematicBox";

export const underscorifyPortArrangement = (
  portArrangement?: PortArrangement | undefined,
): SchematicComponentInput["port_arrangement"] | undefined => {
  if (!portArrangement) return undefined;
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
    };
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
    };
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
    };
  }

  return undefined;
};
