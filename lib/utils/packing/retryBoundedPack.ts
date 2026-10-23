import {
  PackSolver2,
  type InputComponent,
  type PackInput,
} from "calculate-packing"

/**
 * Retry an empty rectangular packing region from its edges. All coordinates
 * are group-local PCB points in mm (+X right, +Y top, right-handed, +Z above).
 * This preserves the requested gap; a center-first greedy layout can run out
 * of candidates even when the same components fit when started at an edge.
 */
export const retryBoundedPack = (input: PackInput): PackSolver2 | undefined => {
  if (
    !input.bounds ||
    input.boundaryOutline?.length ||
    input.obstacles?.length ||
    input.components.some((c) => c.isStatic)
  )
    return undefined
  const componentBounds = (component: InputComponent) => {
    const boxes = component.pads.map((pad) => ({
      x: pad.offset.x,
      y: pad.offset.y,
      width: pad.size.x,
      height: pad.size.y,
    }))
    if (component.courtyard)
      boxes.push({
        ...component.courtyard.offsetFromCenter,
        width: component.courtyard.width,
        height: component.courtyard.height,
      })
    return {
      minX: Math.min(...boxes.map((b) => b.x - b.width / 2)),
      maxX: Math.max(...boxes.map((b) => b.x + b.width / 2)),
      minY: Math.min(...boxes.map((b) => b.y - b.height / 2)),
      maxY: Math.max(...boxes.map((b) => b.y + b.height / 2)),
    }
  }
  const first = input.components[0]
  if (
    !first ||
    !first.pads.length ||
    (first.availableRotationDegrees &&
      !first.availableRotationDegrees.includes(0))
  )
    return undefined
  const extents = componentBounds(first)
  const { bounds } = input
  const minX = bounds.minX - extents.minX
  const maxX = bounds.maxX - extents.maxX
  const minY = bounds.minY - extents.minY
  const maxY = bounds.maxY - extents.maxY
  if (minX > maxX || minY > maxY) return undefined
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  for (const center of [
    { x: midX, y: minY },
    { x: midX, y: maxY },
    { x: minX, y: midY },
    { x: maxX, y: midY },
  ]) {
    const solver = new PackSolver2({
      ...input,
      components: input.components.map((component) =>
        component === first
          ? { ...component, center, ccwRotationOffset: 0, isStatic: true }
          : component,
      ),
    })
    solver.solve()
    if (!solver.solved || solver.failed) continue
    // The seed is a placement candidate, not an authored static component.
    for (const component of solver.packedComponents) {
      if (component.componentId === first.componentId)
        component.isStatic = false
    }
    return solver
  }
  return undefined
}
