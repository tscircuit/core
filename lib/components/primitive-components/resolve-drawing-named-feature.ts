import { drawingCadPointToScene } from "./drawing-cad-point-to-scene"
import type { AnyCircuitElement, CadComponent } from "circuit-json"
import { vec3 } from "gl-matrix"
import { executeJscadOperations, type JscadImplementation } from "jscad-planner"
import type { AssemblyDrawingPartView } from "./AssemblyDrawingPartView"
import { getAssemblyScope } from "./get-assembly-scope-components"

/** Native profiles stay in the JSCAD reader. Apply the native feature matrix,
 * then the exported mesh placement/translation/unit transform, then the rigid
 * CAD (+Z-up) -> glTF (+Y-up) rotation. The glTF exporter maps CAD
 * (x,y,z) to (-x,z,y); see COORDINATE_TRANSFORMS.CIRCUIT_Z_UP_TO_SCENE_Y_UP
 * and GLTFBuilder.convertMeshToGLTFOrientation in circuit-json-to-gltf. Every result is a scene-world point in mm.
 */
export async function resolveDrawingNamedFeature(
  view: AssemblyDrawingPartView,
  selected: AnyCircuitElement[],
  selector: string,
): Promise<{ name: string; points: vec3[] }> {
  const { default: jscad } = await import("@tscircuit/jscad")
  const segments = selector.split(">").map((segment) => segment.trim())
  const featureSelector = segments.pop()!
  if (!featureSelector.startsWith(".") || featureSelector.length === 1)
    throw new Error(
      `Dimension edgeRef "${selector}" must select a named model feature`,
    )
  const featureName = featureSelector.slice(1)
  const partSelector = segments.join(" > ")
  const partIds = partSelector
    ? new Set(
        getAssemblyScope(view)
          .selectAll(partSelector)
          .flatMap((part) => [part, ...part.getDescendants()])
          .flatMap((part) =>
            part.source_component_id ? [part.source_component_id] : [],
          ),
      )
    : undefined
  const candidates = selected.filter(
    (element): element is CadComponent =>
      element.type === "cad_component" &&
      (!partIds || partIds.has(element.source_component_id)),
  )
  const matching: { cad: CadComponent; points: vec3[] }[] = []
  for (const cad of candidates) {
    if (!cad.model_jscad) continue
    // Planner accepts several adapters (including broader cube option types).
    // This reader evaluates ordinary native JSCAD plans with the named kernel.
    const plans = Array.isArray(cad.model_jscad)
      ? cad.model_jscad.flat(Infinity)
      : [cad.model_jscad]
    const solid = plans.map((plan) =>
      executeJscadOperations(jscad as unknown as JscadImplementation, plan),
    )
    const features = jscad.references.collect(solid)
    if (!Object.hasOwn(features, featureName)) continue
    const { geometry, matrix } = features[featureName]!
    let path: number[][]
    if (jscad.geometries.path2.isA(geometry))
      path = jscad.geometries.path2.toPoints(
        jscad.geometries.path2.clone(geometry),
      )
    else {
      const outlines = jscad.geometries.geom2.toOutlines(
        jscad.geometries.geom2.clone(geometry),
      )
      if (outlines.length !== 1)
        throw new Error(
          `Model feature "${featureName}" has multiple contours; name the intended outline separately`,
        )
      path = outlines[0]!
    }
    matching.push({
      cad,
      points: path.map(([x, y]) => {
        const point = vec3.transformMat4([0, 0, 0], [x!, y!, 0], matrix)
        return drawingCadPointToScene(cad, point)
      }),
    })
  }
  if (matching.length !== 1)
    throw new Error(
      matching.length
        ? `Dimension edgeRef "${selector}" is ambiguous within this part view; qualify it with the part name`
        : `Dimension edgeRef "${selector}" was not found in this part view's JSCAD models`,
    )
  return { name: featureName, points: matching[0]!.points }
}
