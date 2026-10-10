import type { Bounds, Point } from "@tscircuit/math-utils"
import type { PcbSilkscreenText } from "circuit-json"
import type {
  PcbComponentId,
  PcbSilkscreenTextId,
} from "lib/utils/circuit-json/circuit-json-id-types"

/** The side of the board a solver places labels on. */
export type SilkscreenLabelLayer = "top" | "bottom"

/**
 * Counter-clockwise degrees. Moved labels are horizontal or vertical; vertical
 * ones read from the right edge as seen from their side: 90 on top, 270 on the
 * bottom, where text is mirrored.
 */
export type SilkscreenLabelRotation = 0 | 90 | 270

/**
 * Notes are drawn in the viewer but never printed, so labels only prefer not
 * to cover them. A mounted board hides the silkscreen under it, and so does a
 * part, whose courtyard a label may touch but not cover.
 */
export type SilkscreenLabelObstacleKind =
  | "copper"
  | "hole"
  | "cutout"
  | "silkscreen"
  | "courtyard"
  | "text"
  | "note"
  | "mounted_board"

/**
 * Geometry in this module is in the board frame, seen from the top on both
 * sides: mm, +X right, +Y toward the top of the board, axis-aligned bounds.
 */
export interface SilkscreenLabelObstacle {
  kind: SilkscreenLabelObstacleKind
  bounds: Bounds
  /** null for board-level features. */
  pcbComponentId: PcbComponentId | null
}

/** `bounds` covers what reads as the part: its pads, holes, own silkscreen and courtyard. */
export interface SilkscreenLabelPart {
  pcbComponentId: PcbComponentId
  bounds: Bounds
}

export interface MovableSilkscreenLabel {
  pcbSilkscreenTextId: PcbSilkscreenTextId
  pcbComponentId: PcbComponentId
  text: string
  fontSize: number
  /** Knockout labels cover their padded fill. */
  isKnockout?: boolean
  knockoutPadding?: PcbSilkscreenText["knockout_padding"]
  currentBounds: Bounds
  /** Counter-clockwise degrees, any angle. */
  currentCcwRotation: number
}

/** Distances are in mm. */
export interface SilkscreenLabelPlacementOptions {
  partGap: number
  /** Preferred gap between a label and its own part. */
  ownPartGap: number
  /** Smallest gap between a label and its own part. */
  ownPartHugGap: number
  labelClearance: number
  boardEdgeMargin: number
  candidateStep: number
  /** Furthest a candidate spot is pushed out to clear obstacles. */
  maxPushOut: number
  maxEjectedLabels: number
  maxEjectionTargets: number
  maxPasses: number
  /** Added to every spot but the current one, so labels only move for a clear gain. */
  costToMove: number
}

export interface SilkscreenLabelPlacementSolverParams {
  /** The side the parts, obstacles and labels are on. */
  layer: SilkscreenLabelLayer
  /** null when the board has no shape. */
  boardOutline: Point[] | null
  parts: SilkscreenLabelPart[]
  obstacles: SilkscreenLabelObstacle[]
  labels: MovableSilkscreenLabel[]
  options?: Partial<SilkscreenLabelPlacementOptions>
}

/**
 * New spot of a moved label: the anchor of its center-aligned text. Glyphs sit
 * low and left of their anchor, so it is not the center of the text.
 */
export interface SilkscreenLabelPlacement {
  pcbSilkscreenTextId: PcbSilkscreenTextId
  anchorPosition: Point
  ccwRotation: SilkscreenLabelRotation
}
