import { MultilayerIjump as BaseMultilayerIjump } from "@tscircuit/infgrid-ijump-astar"

const dirFromAToB = (
  nodeA: { x: number; y: number; l: number },
  nodeB: { x: number; y: number; l: number },
) => ({
  dx: nodeB.x > nodeA.x ? 1 : nodeB.x < nodeA.x ? -1 : 0,
  dy: nodeB.y > nodeA.y ? 1 : nodeB.y < nodeA.y ? -1 : 0,
  dl: nodeB.l > nodeA.l ? 1 : nodeB.l < nodeA.l ? -1 : 0,
})

const manDist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

const ORTHO_DIRS = [
  { dx: 0, dy: 1, dl: 0 },
  { dx: 1, dy: 0, dl: 0 },
  { dx: 0, dy: -1, dl: 0 },
  { dx: -1, dy: 0, dl: 0 },
] as const

/**
 * Patched wrapper around `@tscircuit/infgrid-ijump-astar`'s `MultilayerIjump`.
 *
 * In `@tscircuit/infgrid-ijump-astar@0.0.35`, the obstacle-overcome branch of
 * `MultilayerIjump.getNeighbors()` pushes `travelDistance: goalDistAlongTravelDir`
 * whenever `travelDir.wallDistance === Infinity`, without checking
 * `isGoalInTravelDir && goalDistAlongTravelDir > 0`. Because the primary branch
 * already handles `isGoalInTravelDir && goalDistAlongTravelDir > 0`, reaching
 * the overcome branch with `wallDistance === Infinity` means the goal is behind
 * (or aligned with) `node` along `travelDir`, emitting a wild jump away from
 * the goal by `|goal - node|`.
 */
export class MultilayerIjump extends BaseMultilayerIjump {
  override getNeighbors(node: any): any[] {
    const neighbors = super.getNeighbors(node)
    const goalPoint = (this as any).goalPoint
    const obstacles = (this as any).obstacles
    const obstacleMargin = (this as any).OBSTACLE_MARGIN

    if (!node?.obstacleHit || !goalPoint || !obstacles) {
      return neighbors
    }

    const goalDistIgnoringLayer = manDist(node, goalPoint)
    if (goalDistIgnoringLayer <= obstacleMargin) {
      return neighbors
    }

    const forwardDir = !node.parent
      ? dirFromAToB(node, goalPoint)
      : dirFromAToB(node.parent, node)

    const filteredNeighbors = [...neighbors]

    for (const dir of ORTHO_DIRS) {
      if (
        dir.dx === forwardDir.dx * -1 &&
        dir.dy === forwardDir.dy * -1 &&
        dir.dl === forwardDir.dl * -1
      ) {
        continue
      }
      if (
        dir.dx === forwardDir.dx &&
        dir.dy === forwardDir.dy &&
        dir.dl === forwardDir.dl &&
        node.parent?.obstacleHit
      ) {
        continue
      }

      const collisionInfo = obstacles.getOrthoDirectionCollisionInfo(
        node,
        dir,
        {
          margin: obstacleMargin,
        },
      )
      if (collisionInfo.wallDistance !== Infinity) {
        continue
      }

      const goalDistAlongTravelDir = Math.abs(
        dir.dx !== 0 ? goalPoint.x - node.x : goalPoint.y - node.y,
      )
      const isGoalInTravelDir =
        (dir.dx === 0 || Math.sign(goalPoint.x - node.x) === dir.dx) &&
        (dir.dy === 0 || Math.sign(goalPoint.y - node.y) === dir.dy)

      if (goalDistAlongTravelDir > 0 && isGoalInTravelDir) {
        continue
      }

      const unguardedX = node.x + dir.dx * goalDistAlongTravelDir
      const unguardedY = node.y + dir.dy * goalDistAlongTravelDir

      // Remove the unguarded goalDistAlongTravelDir neighbor emitted by the
      // `travelDir.wallDistance === Infinity` block in the overcome branch.
      for (let i = filteredNeighbors.length - 1; i >= 0; i--) {
        const candidate: any = filteredNeighbors[i]
        if (
          Math.abs(candidate.x - unguardedX) < 1e-9 &&
          Math.abs(candidate.y - unguardedY) < 1e-9 &&
          candidate.l === node.l &&
          candidate.obstacleHit == null &&
          candidate.enterMarginCost === 0 &&
          candidate.travelMarginCostFactor === 1
        ) {
          filteredNeighbors.splice(i, 1)
          break
        }
      }
    }

    return filteredNeighbors
  }
}
