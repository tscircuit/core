import jscad from "@tscircuit/jscad"
import type { AnyCircuitElement, CadComponent } from "circuit-json"
import { vec3 } from "gl-matrix"
import {
  executeJscadOperations,
  type JscadImplementation,
  type JscadOperation,
} from "jscad-planner"
import type { DrawCall } from "poppygl"
import {
  createDrawCall,
  getCadModelMatrix,
  getJscadPlanPositions,
} from "./get-drawing-draw-calls"

export interface DrawingModelFeature {
  name: string
  sourceComponentId: CadComponent["source_component_id"]
  /** Native outline in right-handed glTF scene mm (+Y up), including placement. */
  drawCalls: DrawCall[]
}

/** Read native construction outlines, never mesh indices or synthesized names.
 * The kernel applies outline-local matrices in right-handed CAD XYZ (+Z up, mm),
 * then the part's model matrix places them in glTF world mm.
 */
export function getDrawingModelFeatures(
  selected: AnyCircuitElement[],
): DrawingModelFeature[] {
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
    const planPositions = getJscadPlanPositions(cad.model_jscad)
    if (!planPositions.length)
      throw new Error(`Part "${partName}" has no native model geometry`)
    // Outlines share the solid's placement, so origin, unit scale, alignment
    // and fit match the measured model exactly.
    const model = getCadModelMatrix(cad, planPositions, selected)
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
      const positions = segments.flatMap((segment) =>
        segment.flatMap(([x, y]) => [
          ...vec3.transformMat4(vec3.create(), [x!, y!, 0], feature.matrix),
        ]),
      )
      const drawCall = createDrawCall(positions, model, 1)
      drawCall.indices = Uint32Array.from(
        { length: positions.length / 3 },
        (_, i) => i,
      )
      features.push({
        name,
        sourceComponentId: cad.source_component_id,
        drawCalls: [drawCall],
      })
    }
  }
  return features
}
