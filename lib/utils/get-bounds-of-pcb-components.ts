import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent";

export function getBoundsOfPcbComponents(components: PrimitiveComponent[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const child of components) {
    let bounds;

    if (child.isPcbPrimitive) {
      const { x, y } = child._getGlobalPcbPositionBeforeLayout();
      const { width, height } = child.getPcbSize();
      minX = Math.min(minX, x - width / 2);
      minY = Math.min(minY, y - height / 2);
      maxX = Math.max(maxX, x + width / 2);
      maxY = Math.max(maxY, y + height / 2);
      continue;
    }

    if (child.pcb_component_id) {
      bounds = child._getPcbCircuitJsonBounds();
    } else if (child.componentName === "Footprint") {
      bounds = getBoundsOfPcbComponents(child.children);
    } else if (child.children.length > 0) {
      bounds = getBoundsOfPcbComponents(child.children);
    }

    if (bounds) {
      if ("bounds" in bounds) {
        minX = Math.min(minX, bounds.bounds.left);
        minY = Math.min(minY, bounds.bounds.top);
        maxX = Math.max(maxX, bounds.bounds.right);
        maxY = Math.max(maxY, bounds.bounds.bottom);
      } else {
        minX = Math.min(minX, bounds.minX);
        minY = Math.min(minY, bounds.minY);
        maxX = Math.max(maxX, bounds.maxX);
        maxY = Math.max(maxY, bounds.maxY);
      }
    }
  }

  return {
    minX: isFinite(minX) ? minX : 0,
    minY: isFinite(minY) ? minY : 0,
    maxX: isFinite(maxX) ? maxX : 0,
    maxY: isFinite(maxY) ? maxY : 0,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}
