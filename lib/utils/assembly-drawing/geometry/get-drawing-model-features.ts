import jscad from "@tscircuit/jscad"
import type { AnyCircuitElement, CadComponent } from "circuit-json"
import {
  applyCoordinateTransform,
  COORDINATE_TRANSFORMS,
  convertCircuitJsonTo3D,
  convertSceneToGLTF,
  loadJscadPlan,
  type Point3,
  type STLMesh,
} from "circuit-json-to-gltf"
import { vec3 } from "gl-matrix"
import {
  executeJscadOperations,
  type JscadImplementation,
  type JscadOperation,
} from "jscad-planner"
import type { DrawCall } from "poppygl"
import { loadDrawingScene } from "./get-drawing-view-geometry"

export interface DrawingModelFeature {
  name: string
  sourceComponentId: CadComponent["source_component_id"]
  /** Native outline in right-handed glTF scene mm (+Y up), including placement. */
  drawCalls: DrawCall[]
}

/** Read native construction outlines, never mesh indices or synthesized names.
 * The kernel applies outline-local matrices in right-handed CAD XYZ (+Z up, mm).
 * The exporter owns the conversion to its mesh frame and final glTF placement.
 */
export async function getDrawingModelFeatures(
  selected: AnyCircuitElement[],
): Promise<DrawingModelFeature[]> {
  const features: DrawingModelFeature[] = []
  for (const cad of selected) {
    if (cad.type !== "cad_component" || !cad.model_jscad) continue
    const source = selected.find(
      (part) =>
        part.type === "source_component" &&
        part.source_component_id === cad.source_component_id,
    )
    const partName =
      source?.type === "source_component" ? source.name : "unnamed part"
    const plans = (
      Array.isArray(cad.model_jscad) ? cad.model_jscad : [cad.model_jscad]
    ) as JscadOperation[]
    // The planner accepts a superset of native overloads (e.g. cube sizes).
    // Its evaluator dispatches each validated operation to the native kernel.
    const nativeFeatures = (() => {
      try {
        return jscad.references.collect(
          plans.flatMap((plan) =>
            executeJscadOperations(
              jscad as unknown as JscadImplementation,
              plan,
            ),
          ),
        )
      } catch {
        throw new Error(
          `Part "${partName}" has invalid or duplicate named model geometry`,
        )
      }
    })()
    if (!Object.keys(nativeFeatures).length) continue
    const { boxes } = await convertCircuitJsonTo3D(
      [...(source ? [source] : []), cad],
      {
        renderBoardTextures: false,
        showBoundingBoxes: false,
        drawFauxBoard: false,
      },
    )
    const box = boxes[0]
    if (!box?.mesh)
      throw new Error(`Part "${partName}" has no native model geometry`)
    const rawMesh = loadJscadPlan(cad.model_jscad)
    // Paired with circuit-json-to-gltf getMeshWithBoardNormalTransform.
    // Its intermediate mesh frame is left-handed (+X CAD X, +Y CAD Z,
    // +Z CAD Y), in mm. The GLTF exporter restores handedness. Normalize
    // native features using the actual fitted solid bounds, so origin, unit
    // scale, inferred alignment and contain/fill policies stay exporter-owned.
    const normalRotations = {
      "x+": { x: 0, y: 0, z: 90 },
      "x-": { x: 0, y: 0, z: -90 },
      "y+": { x: 0, y: 0, z: 0 },
      "y-": { x: 0, y: 0, z: 180 },
      "z+": { x: 0, y: 0, z: 0 },
      "z-": { x: 180, y: 0, z: 0 },
    }
    const orient = (p: Point3) =>
      applyCoordinateTransform(p, {
        rotation: normalRotations[cad.model_board_normal_direction ?? "z+"],
      })
    const rawPoints = rawMesh.triangles.flatMap((triangle) =>
      triangle.vertices.map(orient),
    )
    const rawBounds = {
      min: { x: Infinity, y: Infinity, z: Infinity },
      max: { x: -Infinity, y: -Infinity, z: -Infinity },
    }
    for (const point of rawPoints)
      for (const axis of ["x", "y", "z"] as const) {
        rawBounds.min[axis] = Math.min(rawBounds.min[axis], point[axis])
        rawBounds.max[axis] = Math.max(rawBounds.max[axis], point[axis])
      }
    const normalize = (point: Point3) => {
      const normalized = { ...point }
      for (const axis of ["x", "y", "z"] as const) {
        const span = rawBounds.max[axis] - rawBounds.min[axis]
        if (span <= 1e-12)
          throw new Error(
            `Part "${partName}" has degenerate native model geometry`,
          )
        normalized[axis] =
          box.mesh!.boundingBox.min[axis] +
          ((point[axis] - rawBounds.min[axis]) / span) *
            (box.mesh!.boundingBox.max[axis] - box.mesh!.boundingBox.min[axis])
      }
      return normalized
    }
    for (const [name, feature] of Object.entries(nativeFeatures)) {
      const geometry = feature.geometry
      const segments = jscad.geometries.geom2.isA(geometry)
        ? jscad.geometries.geom2.toSides(geometry)
        : (() => {
            const points = jscad.geometries.path2.toPoints(geometry)
            return points
              .slice(0, geometry.isClosed ? points.length : -1)
              .map((point, i) => [point, points[(i + 1) % points.length]!])
          })()
      const placedSegments = segments.map((segment) =>
        segment.map(([x, y]) => {
          const p = vec3.transformMat4(
            new Float64Array(3),
            [x!, y!, 0],
            feature.matrix,
          )
          return normalize(
            orient(
              applyCoordinateTransform(
                { x: p[0]!, y: p[1]!, z: p[2]! },
                COORDINATE_TRANSFORMS.CIRCUIT_Z_UP_TO_SCENE_Y_UP,
              ),
            ),
          )
        }),
      )
      // The exporter's actual box transform places witness geometry just like
      // its solid. Degenerate triangles carry outline segments without surfaces.
      const mesh: STLMesh = {
        triangles: placedSegments.map(([start, end]) => ({
          vertices: [start!, end!, start!],
          normal: { x: 0, y: 0, z: 1 },
        })),
        boundingBox: box.mesh.boundingBox,
      }
      const scene = await loadDrawingScene(
        await convertSceneToGLTF(
          { boxes: [{ ...box, mesh }] },
          { binary: true },
        ),
      )
      // Each degenerate triangle carries one segment. Preserve the actual
      // exporter transforms, then let section clipping treat these as lines.
      for (const drawCall of scene.drawCalls) {
        const indices =
          drawCall.indices ??
          Uint32Array.from(
            { length: drawCall.positions.length / 3 },
            (_, i) => i,
          )
        drawCall.indices = Uint32Array.from(
          Array.from({ length: indices.length / 3 }, (_, i) => [
            indices[i * 3]!,
            indices[i * 3 + 1]!,
            indices[i * 3 + 1]!,
            indices[i * 3 + 2]!,
            indices[i * 3 + 2]!,
            indices[i * 3]!,
          ]).flat(),
        )
        drawCall.mode = 1
      }
      features.push({
        name,
        sourceComponentId: cad.source_component_id,
        drawCalls: scene.drawCalls,
      })
    }
  }
  return features
}
