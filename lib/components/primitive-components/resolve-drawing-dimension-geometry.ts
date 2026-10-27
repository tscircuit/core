import { executeJscadOperations, type JscadImplementation } from "jscad-planner"
import { drawingCadPointToScene } from "./drawing-cad-point-to-scene"
import { buildSubtree } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, DrawingPartView } from "circuit-json"
import { mat4, vec3 } from "gl-matrix"
import type { Camera, GLTFScene } from "poppygl"

/** Geometry boundary: glTF scene points in right-handed mm, +Y up, CAD +X towards -X and CAD +Y
 * towards +Z (circuit-json-to-gltf exports (-x,z,y)). Paper points are page-centered mm, +X right/+Y up.
 * Camera orientation and section conversion are paired with the published
 * circuit-json-to-drawing coordinates.ts and index.ts camera setup.
 */
export async function resolveDrawingDimensionGeometry(
  circuitJson: AnyCircuitElement[],
  view: DrawingPartView,
) {
  const { default: jscad, geom3ToIndexedMesh } = await import("@tscircuit/jscad")
  const {
    computeWorldAABB,
    createOutlineSection,
    buildCamera,
  } = await import("poppygl")
  const geometry = circuitJson.filter(
    (element) => !element.type.startsWith("drawing_"),
  )
  const ids = new Set(view.source_component_ids)
  const selected = view.source_group_id
    ? buildSubtree(geometry, { source_group_id: view.source_group_id })
    : geometry.filter(
        (element) =>
          (element.type === "source_component" ||
            element.type === "cad_component") &&
          ids.has(element.source_component_id),
      )
  if (view.source_group_id) {
    const subcircuits = new Set(
      selected.flatMap((element) =>
        element.type === "source_group" && element.subcircuit_id
          ? [element.subcircuit_id]
          : [],
      ),
    )
    const included = new Set(selected)
    selected.push(
      ...geometry.filter(
        (element) =>
          element.type.startsWith("pcb_") &&
          "subcircuit_id" in element &&
          subcircuits.has(element.subcircuit_id!) &&
          !("pcb_component_id" in element && element.pcb_component_id) &&
          !included.has(element),
      ),
    )
  }
  if (selected.some((element) => element.type === "pcb_board"))
    throw new Error("Drawing dimensions currently require a part view selecting native JSCAD parts; board geometry needs another model reader")
  const drawCalls: GLTFScene["drawCalls"] = []
  for (const cad of selected) {
    if (cad.type !== "cad_component") continue
    if (
      !cad.model_jscad ||
      (cad.model_origin_position && Object.values(cad.model_origin_position).some((value) => value !== 0)) ||
      (!cad.model_origin_position && cad.model_origin_alignment && cad.model_origin_alignment !== "unknown") ||
      (cad.size && cad.model_object_fit) ||
      (cad.model_board_normal_direction && cad.model_board_normal_direction !== "z+")
    ) {
      const partName = selected.find((part) => part.type === "source_component" && part.source_component_id === cad.source_component_id)
      throw new Error(`Drawing dimensions currently require native JSCAD models with their authored origin; part "${partName && "name" in partName ? partName.name : "unnamed part"}" needs another model reader`)
    }
    const plans = Array.isArray(cad.model_jscad)
      ? cad.model_jscad.flat(Infinity)
      : [cad.model_jscad]
    for (const plan of plans) {
      const solids = [executeJscadOperations(jscad as unknown as JscadImplementation, plan)].flat(Infinity)
      for (const solid of solids) {
        const mesh = geom3ToIndexedMesh(solid)
        const positions: number[] = []
        for (let vertex = 0; vertex < mesh.positions.length; vertex += 3)
          positions.push(...drawingCadPointToScene(cad, [
            mesh.positions[vertex]!,
            mesh.positions[vertex + 1]!,
            mesh.positions[vertex + 2]!,
          ]))
        drawCalls.push({
          positions: new Float32Array(positions),
          indices: new Uint32Array(mesh.indices),
          normals: null,
          uvs: null,
          model: mat4.create(),
          material: {
            baseColorFactor: [0.7, 0.7, 0.7, 1],
            baseColorTexture: null,
          },
        })
      }
    }
  }
  const scene: GLTFScene = { gltf: { asset: { version: "2.0" } }, drawCalls }
  const bounds = computeWorldAABB(scene.drawCalls)
  const center = bounds.min.map(
    (min, axis) => (min + bounds.max[axis]!) / 2,
  ) as [number, number, number]
  const distance = Math.max(
    1,
    Math.hypot(...bounds.min.map((min, axis) => bounds.max[axis]! - min)) * 3,
  )
  const directions = {
    x_positive: [1, 0, 0],
    x_negative: [-1, 0, 0],
    y_positive: [0, 0, -1],
    y_negative: [0, 0, 1],
    z_positive: [0, 1, 0],
    z_negative: [0, -1, 0],
    isometric: [1, 1, -1],
  } as const
  const direction = directions[view.direction]
  const eye = center.map(
    (value, axis) =>
      value + (direction[axis]! * distance) / Math.hypot(...direction),
  ) as [number, number, number]
  const section = view.section
  const retainedDrawCalls = section
    ? createOutlineSection(scene.drawCalls, {
        axis: section.axis === "x" ? "x" : section.axis === "y" ? "z" : "y",
        offset: section.axis === "y" ? -section.offset : section.offset,
        keepSide:
          section.axis === "y"
            ? section.keep_side === "less"
              ? "greater"
              : "less"
            : section.keep_side,
        hatchSpacing: section.hatch_spacing ?? 1,
      }).drawCalls
    : scene.drawCalls
  const points = drawingScenePoints({ ...scene, drawCalls: retainedDrawCalls })
  if (!points.length)
    throw new Error("The part view has no measurable geometry")
  let camera = buildCamera(
    retainedDrawCalls,
    Math.round(view.width * 4),
    Math.round(view.height * 4),
    45,
    eye,
    center,
    view.direction.startsWith("z_") ? "z-" : "y+",
    null,
    "orthographic",
    view.scale == null ? null : view.height / view.scale,
  )
  let scale = view.scale ?? (view.height * camera.proj[5]!) / 2
  if (view.scale == null) {
    const fittedScale = (view.height * camera.proj[5]!) / 2
    const decade = 10 ** Math.floor(Math.log10(fittedScale))
    scale = [5, 2, 1]
      .map((step) => step * decade)
      .find((candidate) => candidate <= fittedScale)!
    camera = buildCamera(
      retainedDrawCalls,
      Math.round(view.width * 4),
      Math.round(view.height * 4),
      45,
      eye,
      center,
      view.direction.startsWith("z_") ? "z-" : "y+",
      null,
      "orthographic",
      view.height / scale,
    )
  }
  return { points, camera, selected, scale }
}

/** Indexed mesh positions become scene-world points (mm, +Y up). Model matrices
 * transform points, including translation; unreferenced vertices are excluded.
 */
function drawingScenePoints(scene: GLTFScene): vec3[] {
  return scene.drawCalls.flatMap((call) =>
    Array.from(
      call.indices
        ? new Set(call.indices)
        : Array.from(
            { length: call.positions.length / 3 },
            (_, vertex) => vertex,
          ),
      (vertex) =>
        vec3.transformMat4(
          [0, 0, 0],
          [
            call.positions[vertex * 3]!,
            call.positions[vertex * 3 + 1]!,
            call.positions[vertex * 3 + 2]!,
          ],
          call.model,
        ),
    ),
  )
}

/** Scene-world points -> camera coordinates in model mm and page-centered paper
 * points. Projection is shared with the exporter's projectDrawingPoint formula.
 */
export function projectDrawingDimensionPoints(
  points: readonly vec3[],
  camera: Camera,
  view: DrawingPartView,
) {
  const projection = mat4.multiply(mat4.create(), camera.proj, camera.view)
  return points.map((point) => {
    const projected = vec3.transformMat4([0, 0, 0], point, projection)
    const measured = vec3.transformMat4([0, 0, 0], point, camera.view)
    return {
      measured,
      paper: {
        x: view.center.x + (projected[0] * view.width) / 2,
        y: view.center.y + (projected[1] * view.height) / 2,
      },
    }
  })
}
