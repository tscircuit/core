import { PlatedHole } from "../../components/primitive-components/PlatedHole"
import type { Obstacle } from "./SimpleRouteJson"

/**
 * Collects obstacles from all plated holes in the circuit
 * @param platedHoles Array of PlatedHole components
 * @returns Array of obstacles for the autorouter
 */
export function collectObstaclesFromPlatedHoles(
  platedHoles: PlatedHole[],
): Obstacle[] {
  return platedHoles.flatMap((hole) => hole.getObstacles())
}
