import { getSizeOfSidesFromPortArrangement } from "./getSizeOfSidesFromPortArrangement"
import { parsePinNumberFromLabelsOrThrow } from "./parsePinNumberFromLabelsOrThrow"

const DEFAULT_SCHEMATIC_BOX_PADDING_MM = 0.4

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

export type NumericSchPinStyleEntry = {
  leftMargin?: number
  rightMargin?: number
  topMargin?: number
  bottomMargin?: number
}

export type NumericSchPinStyle = Record<
  `pin${number}` | number | `${number}`,
  NumericSchPinStyleEntry
>

interface Params {
  schWidth?: number
  schHeight?: number
  portDistanceFromEdge?: number
  schPinSpacing: number
  numericSchPinStyle?: NumericSchPinStyle
  pinCount?: number
  schPortArrangement?: PortArrangement
  pinLabels?: Record<string, string>
}

type Side = "left" | "right" | "top" | "bottom"

export function isExplicitPinMappingArrangement(
  arrangement: PortArrangement,
): arrangement is ExplicitPinMappingArrangement {
  const a = arrangement as ExplicitPinMappingArrangement
  return (
    a.leftSide !== undefined ||
    a.rightSide !== undefined ||
    a.topSide !== undefined ||
    a.bottomSide !== undefined
  )
}
export interface SchematicBoxDimensions {
  pinCount: number
  getPortPositionByPinNumber(
    pinNumber: number,
  ): SchematicBoxPortPositionWithMetadata | null
  getSize(): { width: number; height: number }
  getSizeIncludingPins(): { width: number; height: number }
}

export interface SchematicBoxComponentDimensions {
  schWidth: number
  schHeight: number
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
    sidePinCounts = {
      leftSize: 0,
      rightSize: 0,
      topSize: 0,
      bottomSize: 0,
    }
  }

  const getPinNumberUsingSideIndex = ({
    side,
    sideIndex,
    truePinIndex,
  }: {
    side: "top" | "bottom" | "left" | "right"
    sideIndex: number
    truePinIndex: number
  }) => {
    if (!params.schPortArrangement) return truePinIndex + 1
    if (!isExplicitPinMappingArrangement(params.schPortArrangement))
      return truePinIndex + 1

    const normalCcwDirection = {
      left: "top-to-bottom",
      bottom: "left-to-right",
      right: "bottom-to-top",
      top: "right-to-left",
    }[side]

    const directionAlongSide =
      params.schPortArrangement?.[`${side}Side`]?.direction ??
      normalCcwDirection

    const pinsDefinitionForSide =
      params.schPortArrangement?.[`${side}Side`]?.pins!

    let sideIndexWithDirectionCorrection: number = sideIndex
    if (directionAlongSide !== normalCcwDirection) {
      sideIndexWithDirectionCorrection =
        pinsDefinitionForSide.length - sideIndex - 1
    }

    return parsePinNumberFromLabelsOrThrow(
      pinsDefinitionForSide[sideIndexWithDirectionCorrection]!,
      params.pinLabels,
    )
  }

  // Map the indices to the sides they correspond to
  const orderedTruePorts: Array<{
    trueIndex: number
    pinNumber: number
    side: "left" | "right" | "top" | "bottom"
    distanceFromOrthogonalEdge: number
  }> = []
  let currentDistanceFromEdge = 0
  let truePinIndex = 0
  // moving downward from the top-left corner
  for (let sideIndex = 0; sideIndex < sidePinCounts.leftSize; sideIndex++) {
    const pinNumber = getPinNumberUsingSideIndex({
      side: "left",
      sideIndex,
      truePinIndex,
    })

    const pinStyle =
      params.numericSchPinStyle?.[`pin${pinNumber}`] ??
      params.numericSchPinStyle?.[pinNumber]

    if (pinStyle?.topMargin) {
      currentDistanceFromEdge += pinStyle.topMargin
    }

    orderedTruePorts.push({
      trueIndex: truePinIndex,
      pinNumber,
      side: "left",
      distanceFromOrthogonalEdge: currentDistanceFromEdge,
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
    const pinNumber = getPinNumberUsingSideIndex({
      side: "bottom",
      sideIndex,
      truePinIndex,
    })

    const pinStyle =
      params.numericSchPinStyle?.[`pin${pinNumber}`] ??
      params.numericSchPinStyle?.[pinNumber]

    if (pinStyle?.leftMargin) {
      currentDistanceFromEdge += pinStyle.leftMargin
    }

    orderedTruePorts.push({
      trueIndex: truePinIndex,
      pinNumber,
      side: "bottom",
      distanceFromOrthogonalEdge: currentDistanceFromEdge,
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
    const pinNumber = getPinNumberUsingSideIndex({
      side: "right",
      sideIndex,
      truePinIndex,
    })

    const pinStyle =
      params.numericSchPinStyle?.[`pin${pinNumber}`] ??
      params.numericSchPinStyle?.[pinNumber]

    if (pinStyle?.bottomMargin) {
      currentDistanceFromEdge += pinStyle.bottomMargin
    }

    orderedTruePorts.push({
      trueIndex: truePinIndex,
      pinNumber,
      side: "right",
      distanceFromOrthogonalEdge: currentDistanceFromEdge,
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
    const pinNumber = getPinNumberUsingSideIndex({
      side: "top",
      sideIndex,
      truePinIndex,
    })

    const pinStyle =
      params.numericSchPinStyle?.[`pin${pinNumber}`] ??
      params.numericSchPinStyle?.[pinNumber]

    if (pinStyle?.rightMargin) {
      currentDistanceFromEdge += pinStyle.rightMargin
    }

    orderedTruePorts.push({
      trueIndex: truePinIndex,
      pinNumber,
      side: "top",
      distanceFromOrthogonalEdge: currentDistanceFromEdge,
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
  let resolvedSchWidth = params.schWidth
  if (resolvedSchWidth === undefined) {
    resolvedSchWidth = Math.max(
      sideLengths.top + DEFAULT_SCHEMATIC_BOX_PADDING_MM,
      sideLengths.bottom + DEFAULT_SCHEMATIC_BOX_PADDING_MM,
    )

    // Check if there are actual pin labels on left/right sides
    if (params.pinLabels) {
      const leftRightPins = orderedTruePorts.filter(
        (p) => p.side === "left" || p.side === "right",
      )
      const hasLeftRightLabels = leftRightPins.some(
        (p) =>
          params.pinLabels?.[`pin${p.pinNumber}`] ||
          params.pinLabels?.[p.pinNumber],
      )

      if (hasLeftRightLabels) {
        // Apply minimum width when there are left/right pins with labels
        const MIN_WIDTH_FOR_SIDE_PINS = 0.5
        resolvedSchWidth = Math.max(resolvedSchWidth, MIN_WIDTH_FOR_SIDE_PINS)
      }
    }

    const labelWidth = params.pinLabels
      ? Math.max(
          ...Object.values(params.pinLabels).map(
            (label) => label.length * 0.1, // Estimated text width
          ),
        )
      : 0

    // When label is present, only then add some padding to the width
    const LABEL_PADDING = labelWidth > 0 ? 1.1 : 0
    resolvedSchWidth = Math.max(resolvedSchWidth, labelWidth + LABEL_PADDING)
  }

  let schHeight = params.schHeight
  if (!schHeight) {
    schHeight = Math.max(
      sideLengths.left + DEFAULT_SCHEMATIC_BOX_PADDING_MM,
      sideLengths.right + DEFAULT_SCHEMATIC_BOX_PADDING_MM,
    )
  }

  // Enforce minimum dimensions only when current inner label rectangles overlap.
  if (params.pinLabels) {
    const CHAR_WIDTH = 0.13 // FALLBACK_CHARACTER_WIDTH
    const LABEL_EDGE_OFFSET = 0.1 // PIN_LABEL_EDGE_PADDING in the renderer
    const HALF_TEXT = 0.075 // PIN_LABEL_TEXT_HEIGHT / 2
    type LabelRect = {
      minX: number
      maxX: number
      minY: number
      maxY: number
    }

    const getLabelLen = (pinNumber: number): number => {
      const label =
        params.pinLabels![`pin${pinNumber}`] ??
        params.pinLabels![`${pinNumber}`]
      return label ? label.length * CHAR_WIDTH : 0
    }

    const leftLabels = orderedTruePorts
      .filter((p) => p.side === "left")
      .map((p) => ({
        y: sideLengths.left / 2 - p.distanceFromOrthogonalEdge,
        len: getLabelLen(p.pinNumber),
      }))
      .filter((p) => p.len > 0)
    const rightLabels = orderedTruePorts
      .filter((p) => p.side === "right")
      .map((p) => ({
        y: -sideLengths.right / 2 + p.distanceFromOrthogonalEdge,
        len: getLabelLen(p.pinNumber),
      }))
      .filter((p) => p.len > 0)
    const topLabels = orderedTruePorts
      .filter((p) => p.side === "top")
      .map((p) => ({
        x: sideLengths.top / 2 - p.distanceFromOrthogonalEdge,
        len: getLabelLen(p.pinNumber),
      }))
      .filter((p) => p.len > 0)
    const bottomLabels = orderedTruePorts
      .filter((p) => p.side === "bottom")
      .map((p) => ({
        x: -sideLengths.bottom / 2 + p.distanceFromOrthogonalEdge,
        len: getLabelLen(p.pinNumber),
      }))
      .filter((p) => p.len > 0)

    const rectsOverlap = (a: LabelRect, b: LabelRect) =>
      Math.min(a.maxX, b.maxX) > Math.max(a.minX, b.minX) &&
      Math.min(a.maxY, b.maxY) > Math.max(a.minY, b.minY)

    const getLeftRect = (
      label: (typeof leftLabels)[number],
      width: number,
    ): LabelRect => ({
      minX: -width / 2 + LABEL_EDGE_OFFSET,
      maxX: -width / 2 + LABEL_EDGE_OFFSET + label.len,
      minY: label.y - HALF_TEXT,
      maxY: label.y + HALF_TEXT,
    })

    const getRightRect = (
      label: (typeof rightLabels)[number],
      width: number,
    ): LabelRect => ({
      minX: width / 2 - LABEL_EDGE_OFFSET - label.len,
      maxX: width / 2 - LABEL_EDGE_OFFSET,
      minY: label.y - HALF_TEXT,
      maxY: label.y + HALF_TEXT,
    })

    const getTopRect = (
      label: (typeof topLabels)[number],
      height: number,
    ): LabelRect => ({
      minX: label.x - HALF_TEXT,
      maxX: label.x + HALF_TEXT,
      minY: height / 2 - LABEL_EDGE_OFFSET - label.len,
      maxY: height / 2 - LABEL_EDGE_OFFSET,
    })

    const getBottomRect = (
      label: (typeof bottomLabels)[number],
      height: number,
    ): LabelRect => ({
      minX: label.x - HALF_TEXT,
      maxX: label.x + HALF_TEXT,
      minY: -height / 2 + LABEL_EDGE_OFFSET,
      maxY: -height / 2 + LABEL_EDGE_OFFSET + label.len,
    })

    if (!params.schHeight) {
      let hasTopBottomLabelCollision = false

      for (const topLabel of topLabels) {
        for (const bottomLabel of bottomLabels) {
          if (
            rectsOverlap(
              getTopRect(topLabel, schHeight),
              getBottomRect(bottomLabel, schHeight),
            )
          ) {
            hasTopBottomLabelCollision = true
            schHeight = Math.max(
              schHeight,
              topLabel.len + bottomLabel.len + 2 * LABEL_EDGE_OFFSET,
            )
          }
        }
      }

      if (hasTopBottomLabelCollision) {
        for (const topLabel of topLabels) {
          const topRect = getTopRect(topLabel, schHeight)
          for (const leftLabel of leftLabels) {
            const leftRect = getLeftRect(leftLabel, resolvedSchWidth)
            if (rectsOverlap(topRect, leftRect)) {
              schHeight = Math.max(
                schHeight,
                2 * (leftRect.maxY + LABEL_EDGE_OFFSET + topLabel.len),
              )
            }
          }
          for (const rightLabel of rightLabels) {
            const rightRect = getRightRect(rightLabel, resolvedSchWidth)
            if (rectsOverlap(topRect, rightRect)) {
              schHeight = Math.max(
                schHeight,
                2 * (rightRect.maxY + LABEL_EDGE_OFFSET + topLabel.len),
              )
            }
          }
        }

        for (const bottomLabel of bottomLabels) {
          const bottomRect = getBottomRect(bottomLabel, schHeight)
          for (const leftLabel of leftLabels) {
            const leftRect = getLeftRect(leftLabel, resolvedSchWidth)
            if (rectsOverlap(bottomRect, leftRect)) {
              schHeight = Math.max(
                schHeight,
                2 * (LABEL_EDGE_OFFSET + bottomLabel.len - leftRect.minY),
              )
            }
          }
          for (const rightLabel of rightLabels) {
            const rightRect = getRightRect(rightLabel, resolvedSchWidth)
            if (rectsOverlap(bottomRect, rightRect)) {
              schHeight = Math.max(
                schHeight,
                2 * (LABEL_EDGE_OFFSET + bottomLabel.len - rightRect.minY),
              )
            }
          }
        }
      }
    }
  }

  const trueEdgePositions = {
    // Top left corner
    left: {
      x: -resolvedSchWidth / 2 - portDistanceFromEdge,
      y: sideLengths.left / 2,
    },
    // bottom left corner
    bottom: {
      x: -sideLengths.bottom / 2,
      y: -schHeight / 2 - portDistanceFromEdge,
    },
    // bottom right corner
    right: {
      x: resolvedSchWidth / 2 + portDistanceFromEdge,
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
    const { distanceFromOrthogonalEdge, side } = p
    const edgePos = trueEdgePositions[side]
    const edgeDir = trueEdgeTraversalDirections[side]

    return {
      x: edgePos.x + distanceFromOrthogonalEdge * edgeDir.x,
      y: edgePos.y + distanceFromOrthogonalEdge * edgeDir.y,
      ...p,
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
      return { width: resolvedSchWidth, height: schHeight }
    },
    getSizeIncludingPins(): { width: number; height: number } {
      const horizontalPinLength =
        (sidePinCounts.leftSize ? portDistanceFromEdge : 0) +
        (sidePinCounts.rightSize ? portDistanceFromEdge : 0)
      const verticalPinLength =
        (sidePinCounts.topSize ? portDistanceFromEdge : 0) +
        (sidePinCounts.bottomSize ? portDistanceFromEdge : 0)

      return {
        width: resolvedSchWidth + horizontalPinLength,
        height: schHeight + verticalPinLength,
      }
    },
    pinCount,
  }
}
