import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

/**
 * Updates schematic primitives (rects, lines, circles, arcs) when a component is moved during layout
 */
export function updateSchematicPrimitivesForLayoutShift({
  db,
  schematicComponentId,
  deltaX,
  deltaY,
}: {
  db: CircuitJsonUtilObjects
  schematicComponentId: string
  deltaX: number
  deltaY: number
}) {
  // Update schematic_rect
  const rects = db.schematic_rect.list({
    schematic_component_id: schematicComponentId,
  })
  for (const rect of rects) {
    rect.center.x += deltaX
    rect.center.y += deltaY
  }

  // Update schematic_line
  const lines = db.schematic_line.list({
    schematic_component_id: schematicComponentId,
  })
  for (const line of lines) {
    line.x1 += deltaX
    line.y1 += deltaY
    line.x2 += deltaX
    line.y2 += deltaY
  }

  // Update schematic_circle
  const circles = db.schematic_circle.list({
    schematic_component_id: schematicComponentId,
  })
  for (const circle of circles) {
    circle.center.x += deltaX
    circle.center.y += deltaY
  }

  // Update schematic_arc
  const arcs = db.schematic_arc.list({
    schematic_component_id: schematicComponentId,
  })
  for (const arc of arcs) {
    arc.center.x += deltaX
    arc.center.y += deltaY
  }
}
