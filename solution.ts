/**
 * Patch for @tscircuit/infgrid-ijump-astar → MultilayerIjump
 *
 * The upstream `MultilayerIjump.getNeighbors` incorrectly adds a neighbor
 * when a wall is hit and the perpendicular direction is open.  That neighbor
 * is placed at `node + dir * |goal - node|`, i.e. mirrored **away** from the
 * goal.  When the A* search later expands that node the resulting trace
 * contains a large, illegal “jump”.
 *
 * The fix removes those spurious neighbors by filtering out any neighbor
 * that increases the Euclidean distance to the goal compared to the current
 * node.  This mirrors the intent of the original guard (`isGoalInTravelDir`)
`
 * that was missing for the `travelDir.wallDistance === Infinity` case.
 *
 * The patch is applied at runtime by monkey‑patching the prototype after the
 * original class has been imported.  It is deliberately lightweight and does
 * not require a fork of the external package.
 */

import {
  MultilayerIjump,
  INode,
  IGoal,
  INeighbor,
} from '@tscircuit/infgrid-ijump-astar';

// Preserve the original implementation so we can delegate to it.
const originalGetNeighbors = MultilayerIjump.prototype.getNeighbors;

// Replace the method with a wrapped version that filters out the bad jumps.
MultilayerIjump.prototype.getNeighbors = function (
  this: MultilayerIjump,
  node: INode,
  goal: IGoal,
): INeighbor[] {
  // Call the upstream implementation first.
  const rawNeighbors = originalGetNeighbors.call(this, node, goal) as INeighbor[];

  // Compute the squared distance from the current node to the goal once.
  const nodeDistSq =
    (node.x - goal.x) * (node.x - goal.x) + (node.y - goal.y) * (node.y - goal.y);

  // Filter out any neighbor that is *farther* from the goal than the current node.
  // The buggy branch creates exactly such a neighbor (mirrored away from the goal).
  const filtered = rawNeighbors.filter((nbr) => {
    const nbrDistSq =
      (nbr.x - goal.x) * (nbr.x - goal.x) + (nbr.y - goal.y) * (nbr.y - goal.y);
    // Keep neighbors that do not increase the distance (allow a tiny epsilon).
    return nbrDistSq <= nodeDistSq + 1e-9;
  });

  return filtered;
};
