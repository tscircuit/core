import type { Obstacle } from "./types"

const CONTAINMENT_TOLERANCE_MM = 1e-6

const isSmtPadObstacle = (obstacle: Obstacle) =>
  Boolean(obstacle.circuitJsonMetadata?.pcb_smtpad_id) &&
  obstacle.ccwRotationDegrees === undefined

const isPlainViaObstacle = (obstacle: Obstacle) =>
  Boolean(obstacle.circuitJsonMetadata?.pcb_via_id) && !obstacle.netIsAssignable

const padContainsVia = (pad: Obstacle, via: Obstacle) =>
  Math.abs(via.center.x - pad.center.x) + via.width / 2 <=
    pad.width / 2 + CONTAINMENT_TOLERANCE_MM &&
  Math.abs(via.center.y - pad.center.y) + via.height / 2 <=
    pad.height / 2 + CONTAINMENT_TOLERANCE_MM

const sharesConnection = (a: Obstacle, b: Obstacle) =>
  a.connectedTo.some((id) => b.connectedTo.includes(id))

/**
 * A via drilled into a same-net SMT pad (e.g. a BGA via-in-pad) is one piece
 * of copper with the pad. On the pad's layer the via adds no copper beyond the
 * pad, and emitting both overlapping obstacles there makes the autorouter's
 * topology merging fail. The via obstacle therefore drops the pad's layer and
 * keeps only the layers where its barrel is the sole copper. Coordinates are
 * circuit-world millimeters.
 */
export const separateViaInPadObstacles = (
  obstacles: Obstacle[],
): Obstacle[] => {
  const pads = obstacles.filter(isSmtPadObstacle)
  if (pads.length === 0) return obstacles

  const removedVias = new Set<Obstacle>()
  for (const via of obstacles) {
    if (!isPlainViaObstacle(via)) continue
    const coveringPadLayers = new Set(
      pads
        .filter((pad) => padContainsVia(pad, via) && sharesConnection(pad, via))
        .flatMap((pad) => pad.layers),
    )
    if (coveringPadLayers.size === 0) continue

    via.layers = via.layers.filter((layer) => !coveringPadLayers.has(layer))
    if (via.layers.length === 0) removedVias.add(via)
  }

  if (removedVias.size === 0) return obstacles
  return obstacles.filter((obstacle) => !removedVias.has(obstacle))
}
