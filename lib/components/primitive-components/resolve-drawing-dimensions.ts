import type { DrawingDimensionLine, DrawingPartView } from "circuit-json"
import type { AssemblyDrawingPartView } from "./AssemblyDrawingPartView"
import type { AssemblyDrawingDimension } from "./AssemblyDrawingDimension"
import {
  projectDrawingDimensionPoints,
  resolveDrawingDimensionGeometry,
} from "./resolve-drawing-dimension-geometry"
import { resolveDrawingNamedFeature } from "./resolve-drawing-named-feature"

type ResolvedDrawingDimension = Omit<
  DrawingDimensionLine,
  "type" | "drawing_dimension_line_id"
>

/** Resolve user intent into page-centered paper mm (+X right/+Y up).
 * Measurements use orthographic camera coordinates in model mm, never paper
 * lengths. Named contours use their dominant projected extent, retaining all
 * native path samples; native topology is never serialized to Circuit JSON.
 */
export async function resolveDrawingDimensions(
  view: AssemblyDrawingPartView,
  drawingView: DrawingPartView,
): Promise<ResolvedDrawingDimension[]> {
  if (!view.children.length) return []
  const { points, camera, selected, scale } =
    await resolveDrawingDimensionGeometry(
      view.root!.db.toArray(),
      drawingView,
      view.root!.platform?.projectBaseUrl,
    )
  const projected = projectDrawingDimensionPoints(points, camera, drawingView)
  const lanes = [0, 0]
  const lines: ResolvedDrawingDimension[] = []
  for (const dimension of view.children as AssemblyDrawingDimension[]) {
    const props = dimension._parsedProps
    const feature = props.edgeRef
      ? await resolveDrawingNamedFeature(view, selected, props.edgeRef)
      : undefined
    const samples = feature
      ? projectDrawingDimensionPoints(feature.points, camera, drawingView)
      : projected
    if (samples.length < 2)
      throw new Error("A drawing dimension needs measurable geometry")
    const extent = (axis: number) => {
      let minimum = Infinity,
        maximum = -Infinity
      for (const sample of samples) {
        minimum = Math.min(minimum, sample.measured[axis]!)
        maximum = Math.max(maximum, sample.measured[axis]!)
      }
      return maximum - minimum
    }
    const axis = props.widthOfView
      ? 0
      : props.heightOfView
        ? 1
        : extent(1) > extent(0)
          ? 1
          : 0
    const ordered = [...samples].sort(
      (a, b) =>
        a.measured[axis]! - b.measured[axis]! ||
        a.measured[1 - axis]! - b.measured[1 - axis]!,
    )
    const start = ordered[0]!,
      end = ordered.at(-1)!
    const measurement = end.measured[axis]! - start.measured[axis]!
    if (!Number.isFinite(measurement) || measurement < 1e-6)
      throw new Error(
        `Dimension "${props.name ?? props.edgeRef ?? (axis === 0 ? "width" : "height")}" has no measurable extent in this view`,
      )
    const baseline =
      projected.reduce(
        (minimum, sample) =>
          Math.min(minimum, axis === 0 ? sample.paper.y : sample.paper.x),
        Infinity,
      ) -
      6 -
      lanes[axis]!++ * 6
    lines.push({
      drawing_part_view_id: drawingView.drawing_part_view_id,
      name: props.name,
      text: `${Number(measurement.toFixed(2))}`,
      start:
        axis === 0
          ? { x: start.paper.x, y: baseline }
          : { x: baseline, y: start.paper.y },
      end:
        axis === 0
          ? { x: end.paper.x, y: baseline }
          : { x: baseline, y: end.paper.y },
      edge_ref_start: start.paper,
      edge_ref_end: end.paper,
      edge_ref_name: feature?.name,
    })
  }
  // Preserve the fitted physical scale so export raster resolution cannot move
  // the geometry relative to the resolved dimension endpoints.
  view.root!.db.drawing_part_view.update(drawingView.drawing_part_view_id, {
    scale,
  })
  return lines
}
