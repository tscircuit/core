import type {
  AnyCircuitElement,
  DrawingDimensionLine,
  DrawingPartView,
} from "circuit-json"
import {
  convertCircuitJsonTo3D,
  convertSceneToGLTF,
} from "circuit-json-to-gltf"
import { vec3 } from "gl-matrix"
import {
  buildCamera,
  computeWorldAABB,
  createOutlineSection,
  type CameraUp,
  type DrawCall,
} from "poppygl"
import type { AssemblyDrawingPartView } from "lib/components/primitive-components/AssemblyDrawingPartView"
import type { AssemblyDrawingDimension } from "lib/components/primitive-components/AssemblyDrawingDimension"
import {
  getDrawingViewGeometry,
  loadDrawingScene,
} from "../geometry/get-drawing-view-geometry"
import { resolveDrawingEdgeReferences } from "./resolve-drawing-edge-references"

export type ResolvedDrawingDimension = Omit<
  DrawingDimensionLine,
  "type" | "drawing_dimension_line_id" | "drawing_part_view_id"
>

/** Camera directions match circuit-json-to-drawing's getViewOrientation:
 * CAD (+Z up) direction vectors become glTF (+Y up) directions, in mm.
 */
const cameraDirections: Record<
  DrawingPartView["direction"],
  [number, number, number]
> = {
  x_positive: [1, 0, 0],
  x_negative: [-1, 0, 0],
  y_positive: [0, 0, -1],
  y_negative: [0, 0, 1],
  z_positive: [0, 1, 0],
  z_negative: [0, -1, 0],
  isometric: [1, 1, -1],
}

/** World-space glTF points, right-handed +Y up, in mm; apply placement once. */
export function getDrawingScenePoints(drawCalls: DrawCall[]) {
  return drawCalls.flatMap((drawCall) => {
    const indices =
      drawCall.indices ??
      Array.from({ length: drawCall.positions.length / 3 }, (_, i) => i)
    return Array.from(indices, (index) =>
      vec3.transformMat4(
        new Float64Array(3),
        drawCall.positions.subarray(index * 3, index * 3 + 3),
        drawCall.model,
      ),
    )
  })
}

/** Resolve physical view-axis measurements and paper-space annotation points
 * (mm, +X right/+Y up). Orthographic camera coordinates retain physical mm;
 * only witness/line placement is scaled into paper coordinates.
 */
export async function resolveDrawingDimensions(
  view: AssemblyDrawingPartView,
  drawingView: Omit<
    DrawingPartView,
    "type" | "drawing_part_view_id" | "drawing_page_id"
  >,
  circuitJson: AnyCircuitElement[],
): Promise<ResolvedDrawingDimension[]> {
  const dimensions = view.children.filter(
    (child): child is AssemblyDrawingDimension =>
      child.componentName === "AssemblyDrawingDimension",
  )
  if (!dimensions.length) return []
  const selected = getDrawingViewGeometry(circuitJson, drawingView)
  const edges = await resolveDrawingEdgeReferences(view, dimensions, selected)
  const fail = (reason: string): never => {
    throw new Error(`Part view "${view.name || "unnamed part view"}" ${reason}`)
  }
  const model = await convertCircuitJsonTo3D(selected, {
    renderBoardTextures: false,
    showBoundingBoxes: false,
    projectBaseUrl: view.root?.platform?.projectBaseUrl,
  }).catch(() => fail("could not resolve model geometry for dimensions"))
  // Failed model loaders may provide a display bounding box. Such a fallback
  // cannot establish a physical measurement.
  if (model.boxes.some((box) => box.meshUrl && !box.mesh))
    fail("could not load model geometry for dimensions")
  const scene = await loadDrawingScene(
    await convertSceneToGLTF(model, { binary: true }).catch(() =>
      fail("could not prepare model geometry for dimensions"),
    ),
  )
  if (!getDrawingScenePoints(scene.drawCalls).length)
    fail("has no geometry to dimension")
  // Paired with circuit-json-to-drawing: eye/target use the uncut world bounds;
  // fitting uses retained section geometry. No rasterization is needed here.
  const bounds = computeWorldAABB(scene.drawCalls)
  const center = bounds.min.map((min, i) => (min + bounds.max[i]!) / 2) as [
    number,
    number,
    number,
  ]
  const distance = Math.max(
    1,
    Math.hypot(...bounds.min.map((min, i) => bounds.max[i]! - min)) * 3,
  )
  const direction = cameraDirections[drawingView.direction]
  const eye = center.map(
    (n, i) => n + (direction[i]! / Math.hypot(...direction)) * distance,
  ) as [number, number, number]
  const up: CameraUp = drawingView.direction.startsWith("z_") ? "z-" : "y+"
  const section = drawingView.section
  const sectionPlane = section
    ? {
        axis:
          section.axis === "x"
            ? ("x" as const)
            : section.axis === "y"
              ? ("z" as const)
              : ("y" as const),
        offset: section.axis === "y" ? -section.offset : section.offset,
        keepSide:
          section.axis === "y"
            ? section.keep_side === "less"
              ? ("greater" as const)
              : ("less" as const)
            : section.keep_side,
        hatchSpacing: section.hatch_spacing ?? 1,
      }
    : undefined
  const retained = sectionPlane
    ? createOutlineSection(scene.drawCalls, sectionPlane).drawCalls
    : scene.drawCalls
  const points = getDrawingScenePoints(retained)
  if (!points.length) fail("has no retained geometry to dimension")
  let camera = buildCamera(
    retained,
    drawingView.width,
    drawingView.height,
    45,
    eye,
    center,
    up,
    null,
    "orthographic",
  )
  // Emit the fitted scale so all exporters use the same paper projection,
  // regardless of raster rounding or the requested pixels/mm.
  drawingView.scale = Number(
    ((camera.proj[5]! * drawingView.height) / 2).toPrecision(6),
  )
  camera = buildCamera(
    retained,
    drawingView.width,
    drawingView.height,
    45,
    eye,
    center,
    up,
    null,
    "orthographic",
    drawingView.height / drawingView.scale,
  )
  const toView = (point: vec3) =>
    vec3.transformMat4(new Float64Array(3), point, camera.view)
  const toPaper = (point: vec3) => {
    const projected = vec3.transformMat4(
      new Float64Array(3),
      point,
      camera.proj,
    )
    return {
      x: drawingView.center.x + (projected[0]! * drawingView.width) / 2,
      y: drawingView.center.y + (projected[1]! * drawingView.height) / 2,
    }
  }
  const projectedPoints = points.map(toView)
  const lanes = { x: 0, y: 0 }
  return dimensions.map((dimension) => {
    const props = dimension._parsedProps
    const edge = edges.get(dimension)
    const edgeDrawCalls =
      edge &&
      (sectionPlane
        ? createOutlineSection(edge.drawCalls, sectionPlane).drawCalls
        : edge.drawCalls)
    const targetPoints = edgeDrawCalls
      ? getDrawingScenePoints(edgeDrawCalls).map(toView)
      : projectedPoints
    if (!targetPoints.length)
      fail(
        `dimension "${props.name || props.edgeRef || "unnamed dimension"}" has no geometry`,
      )
    const extent = (axis: number) =>
      targetPoints.reduce((max, p) => Math.max(max, p[axis]!), -Infinity) -
      targetPoints.reduce((min, p) => Math.min(min, p[axis]!), Infinity)
    const axis = props.heightOfView || (edge && extent(1) > extent(0)) ? 1 : 0
    const other = axis === 0 ? 1 : 0
    // Among equally extreme points choose the one nearest the dimension lane,
    // making witness placement independent of triangle/profile ordering.
    const extreme = (sign: number) =>
      targetPoints.reduce((a, b) => {
        const difference = sign * (b[axis]! - a[axis]!)
        return difference > 1e-7 ||
          (Math.abs(difference) <= 1e-7 && b[other]! > a[other]!)
          ? b
          : a
      })
    const startPoint = extreme(-1),
      endPoint = extreme(1)
    const measurement = endPoint[axis]! - startPoint[axis]!
    if (!Number.isFinite(measurement) || measurement <= 1e-7)
      fail(
        `dimension "${props.name || props.edgeRef || "unnamed dimension"}" has zero projected extent`,
      )
    const edgeStart = toPaper(startPoint),
      edgeEnd = toPaper(endPoint)
    const lane = axis === 0 ? "x" : "y"
    const offset = 5 + 5 * lanes[lane]++
    const outerPoint = projectedPoints.reduce((a, b) =>
      b[other]! > a[other]! ? b : a,
    )
    const outer = toPaper(outerPoint)
    return {
      name: props.name?.trim() || undefined,
      text: `${Number(measurement.toFixed(3)) || Number(measurement.toPrecision(3))} mm`,
      start:
        axis === 0
          ? { x: edgeStart.x, y: outer.y + offset }
          : { x: outer.x + offset, y: edgeStart.y },
      end:
        axis === 0
          ? { x: edgeEnd.x, y: outer.y + offset }
          : { x: outer.x + offset, y: edgeEnd.y },
      edge_ref_start: edgeStart,
      edge_ref_end: edgeEnd,
      edge_ref_name: edge?.name,
    }
  })
}
