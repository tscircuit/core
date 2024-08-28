import { current } from "@tscircuit/soup"
import { getSizeOfSidesFromPortArrangement } from "./getSizeOfSidesFromPortArrangement"
import { schematicPortArrangement } from "@tscircuit/props"
import { z } from "zod"

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

type Side = "left" | "right" | "top" | "bottom"

export interface SchematicBoxDimensions {
  pinCount: number
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
  console.log(params)
  const portDistanceFromEdge =
    params.portDistanceFromEdge ?? params.schPinSpacing * 2

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
        sidePinCounts.leftSize + sidePinCounts.rightSize + sidePinCounts.topSize
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
  for (let sideIndex = 0; sideIndex < sidePinCounts.leftSize; sideIndex++) {
    const pinNumber = truePinIndex + 1 // TODO check mapping from schPortArrangement
    const pinStyle =
      params.schPinStyle?.[`pin${pinNumber}`] ?? params.schPinStyle?.[pinNumber]

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

    const isLastPinOnSide = sideIndex === sidePinCounts.leftSize - 1
    if (!isLastPinOnSide) {
      currentDistanceFromEdge += params.schPinSpacing
    } else {
      sideLengths.left = currentDistanceFromEdge
    }
    truePinIndex++
  }

  currentDistanceFromEdge = 0
  // moving rightward from the left-bottom corner
  for (let sideIndex = 0; sideIndex < sidePinCounts.bottomSize; sideIndex++) {
    const pinNumber = truePinIndex + 1 // TODO check mapping from schPortArrangement
    const pinStyle =
      params.schPinStyle?.[`pin${pinNumber}`] ?? params.schPinStyle?.[pinNumber]

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

    const isLastPinOnSide = sideIndex === sidePinCounts.bottomSize - 1
    if (!isLastPinOnSide) {
      currentDistanceFromEdge += params.schPinSpacing
    } else {
      sideLengths.bottom = currentDistanceFromEdge
    }
    truePinIndex++
  }

  currentDistanceFromEdge = 0
  // moving upward from the bottom-right corner
  for (let sideIndex = 0; sideIndex < sidePinCounts.rightSize; sideIndex++) {
    const pinNumber = truePinIndex + 1 // TODO check mapping from schPortArrangement
    const pinStyle =
      params.schPinStyle?.[`pin${pinNumber}`] ?? params.schPinStyle?.[pinNumber]

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

    const isLastPinOnSide = sideIndex === sidePinCounts.rightSize - 1
    if (!isLastPinOnSide) {
      currentDistanceFromEdge += params.schPinSpacing
    } else {
      sideLengths.right = currentDistanceFromEdge
    }
    truePinIndex++
  }

  currentDistanceFromEdge = 0
  // moving leftward from the top-right corner
  for (let sideIndex = 0; sideIndex < sidePinCounts.topSize; sideIndex++) {
    const pinNumber = truePinIndex + 1 // TODO check mapping from schPortArrangement
    const pinStyle =
      params.schPinStyle?.[`pin${pinNumber}`] ?? params.schPinStyle?.[pinNumber]

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

    const isLastPinOnSide = sideIndex === sidePinCounts.topSize - 1
    if (!isLastPinOnSide) {
      currentDistanceFromEdge += params.schPinSpacing
    } else {
      sideLengths.top = currentDistanceFromEdge
    }
    truePinIndex++
  }

  // Use lengths to determine schWidth and schHeight
  let schWidth = params.schWidth
  if (!schWidth) {
    schWidth = Math.max(
      sideLengths.top + params.schPinSpacing * 2,
      sideLengths.bottom + params.schPinSpacing * 2,
    )
  }
  let schHeight = params.schHeight
  if (!schHeight) {
    schHeight = Math.max(
      sideLengths.left + params.schPinSpacing * 2,
      sideLengths.right + params.schPinSpacing * 2,
    )
  }

  const trueEdgePositions = {
    // Top left corner
    left: {
      x: -schWidth / 2 - portDistanceFromEdge,
      y: sideLengths.left / 2,
    },
    // bottom left corner
    bottom: {
      x: -sideLengths.bottom / 2,
      y: -schHeight / 2 - portDistanceFromEdge,
    },
    // bottom right corner
    right: {
      x: schWidth / 2 + portDistanceFromEdge,
      y: -sideLengths.right / 2,
    },
    // top right corner
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
    pinCount,
  }
}
