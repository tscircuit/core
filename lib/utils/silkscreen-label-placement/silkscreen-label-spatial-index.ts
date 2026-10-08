import type { Bounds } from "@tscircuit/math-utils"
import Flatbush from "flatbush"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
import { expandBounds } from "./label-geometry"
import type {
  MovableSilkscreenLabel,
  SilkscreenLabelObstacle,
  SilkscreenLabelPart,
  SilkscreenLabelPlacementSolverParams,
} from "./types"

/**
 * Searches compare bounding boxes, so they can return items slightly further
 * than `distance`; callers measure the exact gap.
 */
export interface SilkscreenLabelSpatialIndex {
  getPartOfLabelOrThrow(label: MovableSilkscreenLabel): SilkscreenLabelPart
  getObstaclesNear(bounds: Bounds, distance: number): SilkscreenLabelObstacle[]
  getPartsNear(bounds: Bounds, distance: number): SilkscreenLabelPart[]
}

export const createBoundsIndex = (boundsList: Bounds[]) => {
  if (boundsList.length === 0) return null
  const index = new Flatbush(boundsList.length)
  for (const bounds of boundsList)
    index.add(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY)
  index.finish()
  return index
}

/** Returns positions in the indexed list, in list order. */
export const searchBoundsIndex = (
  index: Flatbush | null,
  bounds: Bounds,
  distance: number,
) => {
  if (!index) return []
  const { minX, minY, maxX, maxY } = expandBounds(bounds, distance)
  return index.search(minX, minY, maxX, maxY).sort((a, b) => a - b)
}

export const createSilkscreenLabelSpatialIndex = ({
  parts,
  obstacles,
}: Pick<
  SilkscreenLabelPlacementSolverParams,
  "parts" | "obstacles"
>): SilkscreenLabelSpatialIndex => {
  const partByPcbComponentId = new Map<PcbComponentId, SilkscreenLabelPart>(
    parts.map((part) => [part.pcbComponentId, part]),
  )
  const partIndex = createBoundsIndex(parts.map((part) => part.bounds))
  const obstacleIndex = createBoundsIndex(
    obstacles.map((obstacle) => obstacle.bounds),
  )
  return {
    getPartOfLabelOrThrow: (label) => {
      const part = partByPcbComponentId.get(label.pcbComponentId)
      if (!part)
        throw new Error(
          `Silkscreen label "${label.text}" names a part that is not on the board`,
        )
      return part
    },
    getObstaclesNear: (bounds, distance) =>
      searchBoundsIndex(obstacleIndex, bounds, distance).map(
        (obstaclePosition) => obstacles[obstaclePosition]!,
      ),
    getPartsNear: (bounds, distance) =>
      searchBoundsIndex(partIndex, bounds, distance).map(
        (partPosition) => parts[partPosition]!,
      ),
  }
}
