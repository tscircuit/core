import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent";

export const getCenterOfPcbPrimitives = (
  pcbPrimitives: PrimitiveComponent[],
): { x: number; y: number } => {
  if (pcbPrimitives.length === 0) {
    throw new Error("Cannot get center of empty PCB primitives array");
  }

  // Get positions of all primitives
  const positions = pcbPrimitives
    .map((p) => p._getPcbCircuitJsonBounds().center)
    .filter(Boolean);

  // Calculate average x and y coordinates
  const sumX = positions.reduce((sum, pos) => sum + pos.x, 0);
  const sumY = positions.reduce((sum, pos) => sum + pos.y, 0);

  return {
    x: sumX / positions.length,
    y: sumY / positions.length,
  };
};
