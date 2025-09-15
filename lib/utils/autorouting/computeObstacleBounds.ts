import type { Obstacle } from "./SimpleRouteJson";

export const computeObstacleBounds = (obstacles: Array<Obstacle>) => {
  const minX = Math.min(...obstacles.map((o) => o.center.x));
  const maxX = Math.max(...obstacles.map((o) => o.center.x));
  const minY = Math.min(...obstacles.map((o) => o.center.y));
  const maxY = Math.max(...obstacles.map((o) => o.center.y));

  return { minX, maxX, minY, maxY };
};
