import { getSizeOfSidesFromPortArrangement } from "./getSizeOfSidesFromPortArrangement"

export type VerticalPortSideConfiguration = {
  direction?: "top-to-bottom" | "bottom-to-top"
  pins: number[]
}
export type HorizontalPortSideConfiguration = {
  direction?: "left-to-right" | "right-to-left"
  pins: number[]
}

export type ExplicitPinMappingArrangement = {
  leftSide?: VerticalPortSideConfiguration
  rightSide?: VerticalPortSideConfiguration
  topSide?: HorizontalPortSideConfiguration
  bottomSide?: HorizontalPortSideConfiguration
}
/** @deprecated prefer SidePinCounts */
export interface SideSizes {
  leftSize?: number
  rightSize?: number
  topSize?: number
  bottomSize?: number
}

export interface SidePinCounts {
  leftPinCount?: number
  rightPinCount?: number
  topPinCount?: number
  bottomPinCount?: number
}

export type PortArrangement =
  | SideSizes
  | SidePinCounts
  | ExplicitPinMappingArrangement

interface Params {
  schWidth?: number
  schHeight?: number
  schPinSpacing: number
  schPinStyle?: Record<
    `pin${number}` | number | `${number}`,
    {
      leftMargin?: number
      rightMargin?: number
      topMargin?: number
      bottomMargin?: number
    }
  >
  pinCount?: number
  schPortArrangement?: PortArrangement
}

type Side = "left" | "right" | "top" | "bottom"

export type SchematicBoxPortPositionWithMetadata = {
  trueIndex: number
  pinNumber: number
  side: "left" | "right" | "top" | "bottom"
  distanceFromEdge: number
  x: number
  y: number
}

function isExplicitPinMappingArrangement(
  arrangement: PortArrangement,
): arrangement is ExplicitPinMappingArrangement {
  return (arrangement as ExplicitPinMappingArrangement).leftSide !== undefined
}
/**
 * Get the dimensions of a schematic box based on the provided parameters.
 *
 * A schematic box is a rectangular box with a set of pins on the sides.
 *
 * The user can customize the position of the pins and the spacing between them,
 * this makes computing the box fairly complicated.
 *
 * A note on the internals:
 * * A "true port" refers to a pin/port before it's remapped by the user to a
 *   different position. True Pin 1 is guaranteed to be in the top-left corner
 * * We basically iterate over each side and compute how far we are from the
 *   edge for that side by adding margins together
 */
export interface SchematicBoxDimensions {
  pinCount: number
  getPortPositionByPinNumber(
    pinNumber: number,
  ): SchematicBoxPortPositionWithMetadata | null
  getSize(): { width: number; height: number }
}

export const getAllDimensionsForSchematicBox = (
  params: Params,
): SchematicBoxDimensions => {
  const componentMargin = params.schPinSpacing // Margin around the component

  let sidePinCounts = params.schPortArrangement
    ? getSizeOfSidesFromPortArrangement(params.schPortArrangement)
    : null
  const sideLengths: Record<Side, number> = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }

  let pinCount: number | null = params.pinCount ?? null

  if (pinCount === null) {
    if (sidePinCounts) {
      pinCount =
        sidePinCounts.leftSize +
        sidePinCounts.rightSize +
        sidePinCounts.topSize +
        sidePinCounts.bottomSize
    } else {
      throw new Error("Could not determine pin count for the schematic box")
    }
  }

  if (pinCount && !sidePinCounts) {
    const rightSize = Math.floor(pinCount / 2)
    sidePinCounts = {
      leftSize: pinCount - rightSize,
      rightSize: rightSize,
      topSize: 0,
      bottomSize: 0,
    }
  }

  if (!sidePinCounts) {
    sidePinCounts = {
      leftSize: 0,
      rightSize: 0,
      topSize: 0,
      bottomSize: 0,
    }
  }

  // Use lengths to determine schWidth and schHeight
  const schWidth =
    params.schWidth ??
    Math.max(sidePinCounts.topSize, sidePinCounts.bottomSize) *
      params.schPinSpacing +
      2 * componentMargin
  const schHeight =
    params.schHeight ??
    Math.max(sidePinCounts.leftSize, sidePinCounts.rightSize) *
      params.schPinSpacing +
      2 * componentMargin

  const distributePorts = (
    sideSize: number,
    sideLength: number,
    totalMargin: number,
  ) => {
    if (sideSize <= 1) return 0
    return (sideLength - totalMargin) / (sideSize - 1)
  }

  const orderedTruePorts: SchematicBoxPortPositionWithMetadata[] = []

  let truePinIndex = 0

  // Function to process each side
  const processSide = (
    side: "left" | "right" | "top" | "bottom",
    pins: number[],
    direction: string,
  ) => {
    const isVertical = side === "left" || side === "right"
    const sideLength = isVertical ? schHeight : schWidth
    let totalMargin = 0

    // Calculate total margin for the side
    for (const pin of pins) {
      const pinStyle =
        params.schPinStyle?.[`pin${pin}`] ?? params.schPinStyle?.[pin]
      if (pinStyle) {
        if (isVertical) {
          totalMargin +=
            (pinStyle.topMargin ?? 0) + (pinStyle.bottomMargin ?? 0)
        } else {
          totalMargin +=
            (pinStyle.leftMargin ?? 0) + (pinStyle.rightMargin ?? 0)
        }
      }
    }

    const spacing = distributePorts(
      pins.length,
      sideLength - 2 * componentMargin,
      totalMargin,
    )
    let currentDistanceFromEdge = componentMargin

    pins.forEach((pinNumber, index) => {
      const pinStyle =
        params.schPinStyle?.[`pin${pinNumber}`] ??
        params.schPinStyle?.[pinNumber]

      if (pinStyle) {
        if (isVertical) {
          if (side === "left") {
            currentDistanceFromEdge +=
              direction === "top-to-bottom"
                ? (pinStyle.topMargin ?? 0)
                : (pinStyle.bottomMargin ?? 0)
          } else {
            // right side
            currentDistanceFromEdge +=
              direction === "top-to-bottom"
                ? (pinStyle.bottomMargin ?? 0)
                : (pinStyle.topMargin ?? 0)
          }
        } else {
          if (side === "top") {
            currentDistanceFromEdge +=
              direction === "left-to-right"
                ? (pinStyle.leftMargin ?? 0)
                : (pinStyle.rightMargin ?? 0)
          } else {
            // bottom side
            currentDistanceFromEdge +=
              direction === "left-to-right"
                ? (pinStyle.rightMargin ?? 0)
                : (pinStyle.leftMargin ?? 0)
          }
        }
      }

      orderedTruePorts.push({
        trueIndex: truePinIndex,
        pinNumber,
        side,
        distanceFromEdge: currentDistanceFromEdge,
        x: 0,
        y: 0,
      })

      if (pinStyle) {
        if (isVertical) {
          if (side === "left") {
            currentDistanceFromEdge +=
              direction === "top-to-bottom"
                ? (pinStyle.bottomMargin ?? 0)
                : (pinStyle.topMargin ?? 0)
          } else {
            // right side
            currentDistanceFromEdge +=
              direction === "top-to-bottom"
                ? (pinStyle.topMargin ?? 0)
                : (pinStyle.bottomMargin ?? 0)
          }
        } else {
          if (side === "top") {
            currentDistanceFromEdge +=
              direction === "left-to-right"
                ? (pinStyle.rightMargin ?? 0)
                : (pinStyle.leftMargin ?? 0)
          } else {
            // bottom side
            currentDistanceFromEdge +=
              direction === "left-to-right"
                ? (pinStyle.leftMargin ?? 0)
                : (pinStyle.rightMargin ?? 0)
          }
        }
      }

      currentDistanceFromEdge += spacing
      truePinIndex++
    })

    sideLengths[side] = sideLength
  }

  // Process each side
  if (
    params.schPortArrangement &&
    isExplicitPinMappingArrangement(params.schPortArrangement)
  ) {
    if (params.schPortArrangement.leftSide) {
      processSide(
        "left",
        params.schPortArrangement.leftSide.pins,
        params.schPortArrangement.leftSide.direction ?? "top-to-bottom",
      )
    }
    if (params.schPortArrangement.rightSide) {
      processSide(
        "right",
        params.schPortArrangement.rightSide.pins,
        params.schPortArrangement.rightSide.direction ?? "bottom-to-top",
      )
    }
    if (params.schPortArrangement.topSide) {
      processSide(
        "top",
        params.schPortArrangement.topSide.pins,
        params.schPortArrangement.topSide.direction ?? "left-to-right",
      )
    }
    if (params.schPortArrangement.bottomSide) {
      processSide(
        "bottom",
        params.schPortArrangement.bottomSide.pins,
        params.schPortArrangement.bottomSide.direction ?? "left-to-right",
      )
    }
  } else {
    const leftSide = Array.from(
      { length: sidePinCounts.leftSize },
      (_, i) => i + 1,
    )
    const rightSide = Array.from(
      { length: sidePinCounts.rightSize },
      (_, i) => i + sidePinCounts.leftSize + 1,
    )
    const topSide = Array.from(
      { length: sidePinCounts.topSize },
      (_, i) => i + sidePinCounts.leftSize + sidePinCounts.rightSize + 1,
    )
    const bottomSide = Array.from(
      {
        length:
          pinCount -
          sidePinCounts.leftSize -
          sidePinCounts.rightSize -
          sidePinCounts.topSize,
      },
      (_, i) =>
        i +
        sidePinCounts.leftSize +
        sidePinCounts.rightSize +
        sidePinCounts.topSize +
        1,
    )
    processSide("left", leftSide, "top-to-bottom")
    processSide("right", rightSide, "top-to-bottom")
    processSide("top", topSide, "left-to-right")
    processSide("bottom", bottomSide, "left-to-right")
  }

  const trueEdgePositions = {
    left: { x: -schWidth / 2 - 0.2, y: schHeight / 2 },
    bottom: { x: -schWidth / 2, y: schHeight / 2 + 0.2 },
    right: { x: schWidth / 2 + 0.2, y: -schHeight / 2 },
    top: { x: schWidth / 2, y: -schHeight / 2 - 0.2 },
  }

  const trueEdgeTraversalDirections = {
    left: { x: 0, y: -1 },
    right: { x: 0, y: 1 },
    top: { x: -1, y: 0 },
    bottom: { x: 1, y: 0 },
  }

  const truePortsWithPositions = orderedTruePorts.map((p) => {
    const { distanceFromEdge, side } = p
    const edgePos = trueEdgePositions[side]
    const edgeDir = trueEdgeTraversalDirections[side]

    return {
      ...p,
      x: edgePos.x + distanceFromEdge * edgeDir.x,
      y: edgePos.y + distanceFromEdge * edgeDir.y,
    }
  })

  return {
    getPortPositionByPinNumber(
      pinNumber: number,
    ): SchematicBoxPortPositionWithMetadata | null {
      const port = truePortsWithPositions.find(
        (p) => p.pinNumber.toString() === pinNumber.toString(),
      )
      if (!port) {
        return null
      }
      return port
    },
    getSize(): { width: number; height: number } {
      return { width: schWidth, height: schHeight }
    },
    pinCount,
  }
}
