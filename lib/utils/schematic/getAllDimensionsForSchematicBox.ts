import { getSizeOfSidesFromPortArrangement } from "./getSizeOfSidesFromPortArrangement"

export type VerticalPortSideConfiguration = {
  direction?: "top-to-bottom" | "bottom-to-top"
  pins: number[]
}

export type HorizontalPortSideConfiguration = {
  direction?: "left-to-right" | "right-to-left"
  pins: number[]
}

export type SchematicBoxPortPositionWithMetadata = {
  trueIndex: number
  pinNumber: number
  side: "left" | "right" | "top" | "bottom"
  distanceFromOrthogonalEdge: number
  x: number
  y: number
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
  portDistanceFromEdge?: number
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
  pinLabels?: Record<string, string>
}

type Side = "left" | "right" | "top" | "bottom"

function isExplicitPinMappingArrangement(
  arrangement: PortArrangement,
): arrangement is ExplicitPinMappingArrangement {
  return (arrangement as ExplicitPinMappingArrangement).leftSide !== undefined ||
    (arrangement as ExplicitPinMappingArrangement).rightSide !== undefined ||
    (arrangement as ExplicitPinMappingArrangement).topSide !== undefined ||
    (arrangement as ExplicitPinMappingArrangement).bottomSide !== undefined
}

export interface SchematicBoxDimensions {
  pinCount: number
  getPortPositionByPinNumber(
    pinNumber: number,
  ): SchematicBoxPortPositionWithMetadata | null
  getSize(): { width: number; height: number }
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
export const getAllDimensionsForSchematicBox = (
  params: Params,
): SchematicBoxDimensions => {
  const portDistanceFromEdge = params.portDistanceFromEdge ?? 0.4

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
        (sidePinCounts.leftSize ?? 0) +
        (sidePinCounts.rightSize ?? 0) +
        (sidePinCounts.topSize ?? 0) +
        (sidePinCounts.bottomSize ?? 0)
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

  const orderedTruePorts: SchematicBoxPortPositionWithMetadata[] = []

  function processSidePins(
    sideConfig: VerticalPortSideConfiguration | HorizontalPortSideConfiguration | undefined,
    side: Side,
    size: number,
    currentPinIndex: number
  ): number {
    let currentDistanceFromEdge = 0
    let pins = sideConfig?.pins ?? Array.from(
      { length: size },
      (_, i) => currentPinIndex + i + 1
    )

    // Reverse pins if direction indicates reverse order
    if (
      sideConfig?.direction === "bottom-to-top" ||
      sideConfig?.direction === "right-to-left"
    ) {
      pins = [...pins].reverse()
    }

    pins.forEach((pinNumber, sideIndex) => {
      const pinStyle =
        params.schPinStyle?.[`pin${pinNumber}`] ?? params.schPinStyle?.[pinNumber]

      if (side === "left" || side === "right") {
        if (pinStyle?.topMargin) {
          currentDistanceFromEdge += pinStyle.topMargin
        }
      } else {
        if (pinStyle?.leftMargin) {
          currentDistanceFromEdge += pinStyle.leftMargin
        }
      }

      orderedTruePorts.push({
        trueIndex: currentPinIndex + sideIndex,
        pinNumber,
        side,
        distanceFromOrthogonalEdge: currentDistanceFromEdge,
        x: 0, 
        y: 0, 
      })

      if (side === "left" || side === "right") {
        if (pinStyle?.bottomMargin) {
          currentDistanceFromEdge += pinStyle.bottomMargin
        }
      } else {
        if (pinStyle?.rightMargin) {
          currentDistanceFromEdge += pinStyle.rightMargin
        }
      }

      const isLastPinOnSide = sideIndex === pins.length - 1
      if (!isLastPinOnSide) {
        currentDistanceFromEdge += params.schPinSpacing
      } else {
        sideLengths[side] = currentDistanceFromEdge
      }
    })

    return currentPinIndex + pins.length
  }

  let currentPinIndex = 0

  
  if (sidePinCounts.leftSize) {
    currentPinIndex = processSidePins(
      isExplicitPinMappingArrangement(params.schPortArrangement!)
        ? params.schPortArrangement!.leftSide
        : undefined,
      "left",
      sidePinCounts.leftSize,
      currentPinIndex
    )
  }

  if (sidePinCounts.bottomSize) {
    currentPinIndex = processSidePins(
      isExplicitPinMappingArrangement(params.schPortArrangement!)
        ? params.schPortArrangement!.bottomSide
        : undefined,
      "bottom",
      sidePinCounts.bottomSize,
      currentPinIndex
    )
  }

  if (sidePinCounts.rightSize) {
    currentPinIndex = processSidePins(
      isExplicitPinMappingArrangement(params.schPortArrangement!)
        ? params.schPortArrangement!.rightSide
        : undefined,
      "right",
      sidePinCounts.rightSize,
      currentPinIndex
    )
  }

  if (sidePinCounts.topSize) {
    currentPinIndex = processSidePins(
      isExplicitPinMappingArrangement(params.schPortArrangement!)
        ? params.schPortArrangement!.topSide
        : undefined,
      "top",
      sidePinCounts.topSize,
      currentPinIndex
    )
  }

  // Calculate final dimensions
  let schWidth = params.schWidth
  if (!schWidth) {
    schWidth = Math.max(
      sideLengths.top + params.schPinSpacing * 2,
      sideLengths.bottom + params.schPinSpacing * 2,
      1 // Minimum width
    )
  }

  const labelWidth = params.pinLabels
    ? Math.max(
      ...Object.values(params.pinLabels).map(
        (label) => label.length * 0.1 // Estimated text width
      ),
      0
    )
    : 0

  const LABEL_PADDING = 1.1
  schWidth = Math.max(schWidth, labelWidth + LABEL_PADDING)

  let schHeight = params.schHeight
  if (!schHeight) {
    schHeight = Math.max(
      sideLengths.left + params.schPinSpacing * 2,
      sideLengths.right + params.schPinSpacing * 2,
      1 // Minimum height
    )
  }

  
  const trueEdgePositions = {
    left: {
      x: -schWidth / 2 - portDistanceFromEdge,
      y: sideLengths.left / 2,
    },
    bottom: {
      x: -sideLengths.bottom / 2,
      y: -schHeight / 2 - portDistanceFromEdge,
    },
    right: {
      x: schWidth / 2 + portDistanceFromEdge,
      y: -sideLengths.right / 2,
    },
    top: {
      x: sideLengths.top / 2,
      y: schHeight / 2 + portDistanceFromEdge,
    },
  }

  const trueEdgeTraversalDirections = {
    left: { x: 0, y: -1 },
    right: { x: 0, y: 1 },
    top: { x: -1, y: 0 },
    bottom: { x: 1, y: 0 },
  }

  
  const truePortsWithPositions = orderedTruePorts.map((p) => {
    const { distanceFromOrthogonalEdge, side } = p
    const edgePos = trueEdgePositions[side]
    const edgeDir = trueEdgeTraversalDirections[side]

    return {
      ...p,
      x: edgePos.x + distanceFromOrthogonalEdge * edgeDir.x,
      y: edgePos.y + distanceFromOrthogonalEdge * edgeDir.y,
    }
  })

  return {
    pinCount: pinCount!,
    getPortPositionByPinNumber(
      pinNumber: number,
    ): SchematicBoxPortPositionWithMetadata | null {
      const port = truePortsWithPositions.find(
        (p) => p.pinNumber.toString() === pinNumber.toString(),
      )
      return port ?? null
    },
    getSize(): { width: number; height: number } {
      return { width: schWidth, height: schHeight }
    },
  }
}