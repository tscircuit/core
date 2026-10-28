import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import type { vec3 } from "gl-matrix"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { Hole } from "lib/components/primitive-components/Hole"
import type { PlatedHole } from "lib/components/primitive-components/PlatedHole"
import type { AssemblyDrawingDimension } from "lib/components/primitive-components/AssemblyDrawingDimension"
import type { AssemblyDrawingPartView } from "lib/components/primitive-components/AssemblyDrawingPartView"
import { getDrawingScenePoints } from "../geometry/get-drawing-scene-points"
import { getBoardDrawCalls } from "../geometry/get-drawing-draw-calls"
import type {
  createDrawingReferenceSelector,
  DrawingSelectorNode,
} from "./create-drawing-reference-selector"

/** Resolve finalized reference points in right-handed glTF world mm (+X negative CAD X,
 * +Y CAD Z, +Z CAD Y). Points include PCB layout/model placement once.
 * Native features use the same model placement as edgeRef dimensions.
 */
export async function resolveDrawingReferencePoints(
  view: AssemblyDrawingPartView,
  dimensions: AssemblyDrawingDimension[],
  selected: AnyCircuitElement[],
  select: ReturnType<typeof createDrawingReferenceSelector>,
) {
  const resolved = new Map<AssemblyDrawingDimension, [vec3[], vec3[]]>()
  const cache = new Map<DrawingSelectorNode, vec3[]>()
  const pcbGeometry = (node: DrawingSelectorNode) => {
    const part = node.part
    if (part?.componentName === "Hole")
      return selected.find(
        (element) =>
          element.type === "pcb_hole" &&
          element.pcb_hole_id === (part as Hole).pcb_hole_id,
      )
    if (part?.componentName === "PlatedHole")
      return selected.find(
        (element) =>
          element.type === "pcb_plated_hole" &&
          element.pcb_plated_hole_id ===
            (part as PlatedHole).pcb_plated_hole_id,
      )
    if (part?.componentName === "Board")
      return selected.find(
        (element) =>
          element.type === "pcb_board" &&
          element.pcb_board_id === (part as Board).pcb_board_id,
      )
  }
  const resolve = async (selector: string) => {
    const matches = select(selector).filter(
      (node) => node.feature || pcbGeometry(node),
    )
    const fail = (reason: string): never => {
      throw new Error(
        `Dimension reference "${selector}" in part view "${view.name || "unnamed part view"}" ${reason}`,
      )
    }
    if (matches.length !== 1)
      fail(
        `matched ${matches.length} holes, boards or named model features in the selected geometry; expected exactly one`,
      )
    const node = matches[0]!
    const cached = cache.get(node)
    if (cached) return cached
    let points: vec3[]
    if (node.feature) {
      points = getDrawingScenePoints(node.feature.drawCalls)
    } else {
      const geometry = pcbGeometry(node)!
      // The exporter deforms flexible boards. Flat PCB coordinates cannot be
      // used as witness points on those solids until that deformation is shared.
      if (selected.some((element) => element.type === "pcb_bend"))
        fail("cannot yet anchor PCB references on a folded board")
      if (geometry.type === "pcb_hole" || geometry.type === "pcb_plated_hole") {
        // Paired with circuit-json-to-gltf's boardBox (x, 0, y) and
        // GLTFBuilder.toGltfTranslation: [-center.x, center.y, center.z].
        // A through-hole reference is its midplane center.
        points = [[-geometry.x, 0, geometry.y]]
      } else {
        points = getDrawingScenePoints(
          getBoardDrawCalls(geometry as PcbBoard, [geometry]),
        )
      }
    }
    if (!points.length) fail("has no geometry")
    cache.set(node, points)
    return points
  }
  for (const dimension of dimensions) {
    const { fromRef, toRef } = dimension._parsedProps
    if (fromRef && toRef)
      resolved.set(dimension, [await resolve(fromRef), await resolve(toRef)])
  }
  return resolved
}
