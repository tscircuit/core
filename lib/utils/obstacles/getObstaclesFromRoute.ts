import type { Obstacle } from "./types";

interface PointWithLayer {
  x: number;
  y: number;
  layer: string;
}

const isCloseTo = (a: number, b: number) => Math.abs(a - b) < 0.0001;

export const getObstaclesFromRoute = (
  route: PointWithLayer[],
  source_trace_id: string,
  { viaDiameter = 0.5 }: { viaDiameter?: number } = {},
): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const [start, end] = [route[i], route[i + 1]];
    const prev = i - 1 >= 0 ? route[i - 1] : null;

    const isHorz = isCloseTo(start.y, end.y);
    const isVert = isCloseTo(start.x, end.x);

    if (!isHorz && !isVert) {
      throw new Error(
        `getObstaclesFromTrace currently only supports horizontal and vertical traces (not diagonals) Conflicting trace: ${source_trace_id}, start: (${start.x}, ${start.y}), end: (${end.x}, ${end.y})`,
      );
    }

    const obstacle: Obstacle = {
      type: "rect",
      layers: [start.layer],
      center: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      width: isHorz ? Math.abs(start.x - end.x) : 0.1, // TODO use route width
      height: isVert ? Math.abs(start.y - end.y) : 0.1, // TODO use route width
      connectedTo: [source_trace_id],
    };

    obstacles.push(obstacle);

    if (prev && prev.layer === start.layer && start.layer !== end.layer) {
      const via: Obstacle = {
        type: "rect",
        layers: [start.layer, end.layer],
        center: {
          x: start.x,
          y: start.y,
        },
        connectedTo: [source_trace_id],
        width: viaDiameter,
        height: viaDiameter,
      };
      obstacles.push(via);
    }
  }
  return obstacles;
};
