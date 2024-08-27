import { current } from "@tscircuit/soup"
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
export interface SideSizes {
  leftSize?: number
  rightSize?: number
  topSize?: number
  bottomSize?: number
}

export type PortArrangement = SideSizes | ExplicitPinMappingArrangement

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
}

interface ParsedParams extends Required<Params> {
  leftSide: {
    numPins: number
    pinsFromTopToBottom: Array<{ pinNumber: number }>
  }
  topSide: {
    numPins: number
    pinsFromRightToLeft: Array<{ pinNumber: number }>
  }
  rightSide: {
    numPins: number
    pinsFromBottomToTop: Array<{ pinNumber: number }>
  }
  bottomSide: {
    numPins: number
    pinsFromLeftToRight: Array<{ pinNumber: number }>
  }
  portPositions: Record<`pin${number}`, { x: number; y: number }>
}

interface SchematicBoxDimensions {
  getPortPositionByPinNumber(pinNumber: number): { x: number; y: number }
  getSize(): { width: number; height: number }
}

/**
 * Get the dimensions of a schematic box based on the provided parameters.
 *
 * A schematic box is a rectangular box with a set of pins on the sides.
 *
 * The user can customize the position of the pins and the spacing between them,
 * this makes computing the box fairly complicated.
 */
export const getAllDimensionsForSchematicBox = (
  params: Params,
): SchematicBoxDimensions => {
  const portDistanceFromEdge = params.portDistanceFromEdge ?? 0.2

  let sideSizes = params.schPortArrangement
    ? getSizeOfSidesFromPortArrangement(params.schPortArrangement)
    : null

  let pinCount: number | null = params.pinCount ?? null

  if (pinCount === null) {
    if (sideSizes) {
      pinCount = sideSizes.leftSize + sideSizes.rightSize + sideSizes.topSize
    }

    throw new Error("Could not determine pin count for the schematic box")
  }

  if (pinCount && !sideSizes) {
    const rightSize = Math.floor(pinCount / 2)
    sideSizes = {
      leftSize: pinCount - rightSize,
      rightSize: rightSize,
      topSize: 0,
      bottomSize: 0,
    }
  }

  if (!sideSizes) {
    throw new Error("Could not determine side sizes for the schematic box")
  }

  // Map the indices to the sides they correspond to
  const orderedTruePorts: Array<{
    trueIndex: number
    pinNumber: number
    side: "left" | "right" | "top" | "bottom"
    distanceFromEdge: number
  }> = []
  let currentDistanceFromEdge = 0
  let truePinIndex = 0
  // moving downward from the top-left corner
  let leftTotalLength = 0
  for (let sideIndex = 0; sideIndex < sideSizes.leftSize; sideIndex++) {
    const pinNumber = truePinIndex + 1 // TODO check mapping from schPortArrangement
    const pinStyle =
      params.schPinStyle?.[`pin${sideIndex + 1}`] ??
      params.schPinStyle?.[sideIndex]

    if (pinStyle?.topMargin) {
      currentDistanceFromEdge += pinStyle.topMargin
    }

    orderedTruePorts.push({
      trueIndex: truePinIndex,
      pinNumber,
      side: "left",
      distanceFromEdge: currentDistanceFromEdge,
    })

    if (pinStyle?.bottomMargin) {
      currentDistanceFromEdge += pinStyle.bottomMargin
    }

    const isLastPinOnSide = sideIndex === sideSizes.leftSize - 1
    if (!isLastPinOnSide) {
      currentDistanceFromEdge += params.schPinSpacing
    } else {
      leftTotalLength = currentDistanceFromEdge
    }
    truePinIndex++
  }

  currentDistanceFromEdge = 0
  // moving rightward from the left-bottom corner
  let bottomTotalLength = 0
  for (let sideIndex = 0; sideIndex < sideSizes.bottomSize; sideIndex++) {
    const pinNumber = truePinIndex + 1 // TODO check mapping from schPortArrangement
    const pinStyle =
      params.schPinStyle?.[`pin${sideIndex + 1}`] ??
      params.schPinStyle?.[sideIndex]

    if (pinStyle?.leftMargin) {
      currentDistanceFromEdge += pinStyle.leftMargin
    }

    orderedTruePorts.push({
      trueIndex: truePinIndex,
      pinNumber,
      side: "bottom",
      distanceFromEdge: currentDistanceFromEdge,
    })

    if (pinStyle?.rightMargin) {
      currentDistanceFromEdge += pinStyle.rightMargin
    }

    const isLastPinOnSide = sideIndex === sideSizes.bottomSize - 1
    if (!isLastPinOnSide) {
      currentDistanceFromEdge += params.schPinSpacing
    } else {
      bottomTotalLength = currentDistanceFromEdge
    }
    truePinIndex++
  }

  currentDistanceFromEdge = 0
  // moving upward from the bottom-right corner
  let rightTotalLength = 0
  for (let sideIndex = 0; sideIndex < sideSizes.rightSize; sideIndex++) {
    const pinNumber = truePinIndex + 1 // TODO check mapping from schPortArrangement
    const pinStyle =
      params.schPinStyle?.[`pin${sideIndex + 1}`] ??
      params.schPinStyle?.[sideIndex]

    if (pinStyle?.bottomMargin) {
      currentDistanceFromEdge += pinStyle.bottomMargin
    }

    orderedTruePorts.push({
      trueIndex: truePinIndex,
      pinNumber,
      side: "right",
      distanceFromEdge: currentDistanceFromEdge,
    })

    if (pinStyle?.topMargin) {
      currentDistanceFromEdge += pinStyle.topMargin
    }

    const isLastPinOnSide = sideIndex === sideSizes.rightSize - 1
    if (!isLastPinOnSide) {
      currentDistanceFromEdge += params.schPinSpacing
    } else {
      rightTotalLength = currentDistanceFromEdge
    }
    truePinIndex++
  }

  // moving leftward from the top-right corner
  let topTotalLength = 0
  for (let sideIndex = 0; sideIndex < sideSizes.topSize; sideIndex++) {
    const pinNumber = truePinIndex + 1 // TODO check mapping from schPortArrangement
    const pinStyle =
      params.schPinStyle?.[`pin${sideIndex + 1}`] ??
      params.schPinStyle?.[sideIndex]

    if (pinStyle?.rightMargin) {
      currentDistanceFromEdge += pinStyle.rightMargin
    }

    orderedTruePorts.push({
      trueIndex: truePinIndex,
      pinNumber,
      side: "top",
      distanceFromEdge: currentDistanceFromEdge,
    })

    if (pinStyle?.leftMargin) {
      currentDistanceFromEdge += pinStyle.leftMargin
    }

    const isLastPinOnSide = sideIndex === sideSizes.topSize - 1
    if (!isLastPinOnSide) {
      currentDistanceFromEdge += params.schPinSpacing
    } else {
      topTotalLength = currentDistanceFromEdge
    }
    truePinIndex++
  }

  // Use lengths to determine schWidth and schHeight
  let schWidth = params.schWidth
  if (!schWidth) {
    schWidth = Math.max(topTotalLength + 0.2, bottomTotalLength + 0.2, 1)
  }
  let schHeight = params.schHeight
  if (!schHeight) {
    schHeight = Math.max(leftTotalLength + 0.2, rightTotalLength + 0.2, 1)
  }

  const trueEdgePositions = {
    // Top left corner
    left: {
      x: -schWidth / 2 - portDistanceFromEdge,
      y: leftTotalLength / 2,
    },
    // bottom left corner
    bottom: {
      x: -leftTotalLength / 2,
      y: -schHeight / 2 - portDistanceFromEdge,
    },
    // bottom right corner
    right: {
      x: schWidth / 2 + portDistanceFromEdge,
      y: -leftTotalLength / 2,
    },
    // top right corner
    top: {
      x: leftTotalLength / 2,
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
    const { distanceFromEdge, side } = p
    const edgePos = trueEdgePositions[side]
    const edgeDir = trueEdgeTraversalDirections[side]

    return {
      x: edgePos.x + distanceFromEdge * edgeDir.x,
      y: edgePos.y + distanceFromEdge * edgeDir.y,
      ...p,
    }
  })

  return {
    getPortPositionByPinNumber(pinNumber: number): { x: number; y: number } {
      const port = truePortsWithPositions.find(
        (p) => p.pinNumber.toString() === pinNumber.toString(),
      )
      if (!port) {
        throw new Error(
          `Could not find port for pin number ${pinNumber}, available pins: ${truePortsWithPositions.map((tp) => tp.pinNumber).join(", ")}`,
        )
      }
      return port
    },
    getSize(): { width: number; height: number } {
      return { width: schWidth, height: schHeight }
    },
  }
}
