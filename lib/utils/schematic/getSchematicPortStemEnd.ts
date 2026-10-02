import type {
  SchematicComponent,
  SchematicLine,
  SchematicPort,
} from "circuit-json"

/** The drawn stem's inner endpoint in schematic world mm (+X right, +Y up).
 * Custom stems use their emitted, transformed line. Box stems follow the same
 * side/distance definition as circuit-to-svg's createSvgObjectsForSchPortBoxLine.
 * Named symbol paths already contain their stems; an undeclared custom stem
 * must not be inferred from a terminal's distance to the body.
 */
export function getSchematicPortStemEnd(
  port: SchematicPort,
  component: SchematicComponent,
  stemLine?: SchematicLine,
): { x: number; y: number } | undefined {
  if (stemLine) {
    return stemLine.x1 === port.center.x && stemLine.y1 === port.center.y
      ? { x: stemLine.x2, y: stemLine.y2 }
      : { x: stemLine.x1, y: stemLine.y1 }
  }
  if (component.is_box_with_pins === false || component.symbol_name) return
  const end = { ...port.center }
  const length = port.distance_from_component_edge ?? 0.4
  switch (port.side_of_component) {
    case "left":
      end.x += length
      break
    case "right":
      end.x -= length
      break
    case "top":
      end.y -= length
      break
    case "bottom":
      end.y += length
      break
    default:
      return
  }
  return end
}
