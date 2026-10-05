import type { PinLabelsProp } from "@tscircuit/props"
import type { SchematicComponentInput } from "circuit-json"
import type { PortArrangement } from "lib/utils/schematic/getAllDimensionsForSchematicBox"
import { parsePinNumberFromLabelsOrThrow } from "lib/utils/schematic/parsePinNumberFromLabelsOrThrow"

export const underscorifyPortArrangement = (
  portArrangement?: PortArrangement | undefined,
  pinLabels?: PinLabelsProp,
): SchematicComponentInput["port_arrangement"] | undefined => {
  if (!portArrangement) return undefined
  if (
    "leftSide" in portArrangement ||
    "rightSide" in portArrangement ||
    "topSide" in portArrangement ||
    "bottomSide" in portArrangement
  ) {
    return {
      left_side: portArrangement.leftSide && {
        ...portArrangement.leftSide,
        pins: portArrangement.leftSide.pins.map((pinNumberOrLabel) =>
          parsePinNumberFromLabelsOrThrow(pinNumberOrLabel, pinLabels),
        ),
      },
      right_side: portArrangement.rightSide && {
        ...portArrangement.rightSide,
        pins: portArrangement.rightSide.pins.map((pinNumberOrLabel) =>
          parsePinNumberFromLabelsOrThrow(pinNumberOrLabel, pinLabels),
        ),
      },
      top_side: portArrangement.topSide && {
        ...portArrangement.topSide,
        pins: portArrangement.topSide.pins.map((pinNumberOrLabel) =>
          parsePinNumberFromLabelsOrThrow(pinNumberOrLabel, pinLabels),
        ),
      },
      bottom_side: portArrangement.bottomSide && {
        ...portArrangement.bottomSide,
        pins: portArrangement.bottomSide.pins.map((pinNumberOrLabel) =>
          parsePinNumberFromLabelsOrThrow(pinNumberOrLabel, pinLabels),
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
