import type { Obstacle } from "lib/utils/autorouting/SimpleRouteJson";

// https://github.com/tscircuit/autorouting/blob/9b43f873f860d2459167fa02ba967a2408e11e96/algos/multi-layer-ijump/MultilayerIjump.ts#L114
const MARGINS = [1, 0.1];

export const duplicateObstaclesWithMargins = (obstacles: Obstacle[]) => {
  return obstacles.concat(
    obstacles.flatMap((obstacle) =>
      MARGINS.map((margin) => ({
        ...obstacle,
        width: obstacle.width + margin * 2,
        height: obstacle.height + margin * 2,
        fill: margin === 1 ? "rgba(0,0,255,0.05)" : "rgba(255,0,0,0.2)",
        stroke: margin === 1 ? "rgba(0,0,255,0.05)" : "rgba(255,0,0,0.2)",
      })),
    ),
  );
};
