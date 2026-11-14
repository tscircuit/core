import { mat4 } from "gl-matrix"
import type { DrawingScenePart } from "@tscircuit/circuit-json-to-drawing"
import { expect } from "bun:test"
import { getDrawingViewGeometry } from "lib/utils/assembly-drawing/geometry/get-drawing-view-geometry"
import { RootCircuit } from "lib/RootCircuit"
import { toMatchSvgSnapshot } from "./extend-expect-any-svg"

export interface DrawingSnapshotOptions {
  drawingPageId?: string
  pixelsPerMm?: number
}

/** Render emitted drawing records using the published exporter. Geometry stays
 * in CAD world-space mm (+Z up) until the glTF exporter converts it to +Y up.
 * Drawing viewports are independent paper-space points (+X right, +Y up).
 */
export async function getDrawingSnapshotSvg(
  circuit: RootCircuit,
  options: DrawingSnapshotOptions = {},
) {
  const { convertCircuitJsonToDrawingSvg } = await import(
    "@tscircuit/circuit-json-to-drawing"
  )
  const { convertCircuitJsonToGltf } = await import("circuit-json-to-gltf")
  const { loadGLTFWithResourcesFromURL, createSceneFromGLTF } = await import(
    "poppygl"
  )
  const circuitJson = circuit.getCircuitJson()
  const geometry = circuitJson.filter(
    (element) => !element.type.startsWith("drawing_"),
  )
  // Cache glTF conversion per selection; plan/section/isometric views share geometry.
  const scenes = new Map<string, ReturnType<typeof createSceneFromGLTF>>()
  return convertCircuitJsonToDrawingSvg(circuitJson, {
    ...options,
    pixelsPerMm: options.pixelsPerMm ?? 4,
    supersampling: 2,
    resolveSceneParts: async () => {
      const parts: DrawingScenePart[] = []
      const sources = [
        ...new Set(
          geometry.flatMap((part) =>
            part.type === "cad_component" ? [part.source_component_id] : [],
          ),
        ),
      ]
      const boards = geometry.flatMap((part) =>
        part.type === "pcb_board" ? [part.pcb_board_id] : [],
      )
      // circuit-json-to-gltf GLTFBuilder.toGltfTranslation exports (-x,z,y).
      // The drawing renderer requires (x,z,-y); a paired 180° Y rotation maps
      // both the mesh and its translation, without changing source CAD records.
      const canonicalFrame = mat4.fromYRotation(mat4.create(), Math.PI)
      for (const identity of [
        ...sources.map((source_component_id) => ({ source_component_id })),
        ...boards.map((pcb_board_id) => ({ pcb_board_id })),
      ]) {
        const selected = getDrawingViewGeometry(
          geometry,
          "source_component_id" in identity
            ? { source_component_ids: [identity.source_component_id] }
            : { pcb_board_ids: [identity.pcb_board_id] },
        )
        const glb = await convertCircuitJsonToGltf(selected, {
          format: "glb",
          includeModels: true,
          showBoundingBoxes: false,
        })
        const { gltf, resources } = await loadGLTFWithResourcesFromURL(
          `data:model/gltf-binary;base64,${Buffer.from(glb as ArrayBuffer).toString("base64")}`,
        )
        const scene = createSceneFromGLTF(gltf, resources)
        parts.push({
          ...identity,
          drawCalls: scene.drawCalls.map((call) => ({
            ...call,
            model: mat4.multiply(mat4.create(), canonicalFrame, call.model),
          })),
        })
      }
      return parts
    },
    resolveScene: async (view) => {
      const key = JSON.stringify([
        view.source_group_id,
        view.source_component_ids,
      ])
      const cached = scenes.get(key)
      if (cached) return cached
      const selected = getDrawingViewGeometry(geometry, view)
      const glb = await convertCircuitJsonToGltf(selected, {
        format: "glb",
        includeModels: true,
        showBoundingBoxes: false,
      })
      const { gltf, resources } = await loadGLTFWithResourcesFromURL(
        `data:model/gltf-binary;base64,${Buffer.from(glb as ArrayBuffer).toString("base64")}`,
      )
      const scene = createSceneFromGLTF(gltf, resources)
      scenes.set(key, scene)
      return scene
    },
  })
}

expect.extend({
  async toMatchDrawingSnapshot(
    circuit: unknown,
    testPath: string,
    options?: DrawingSnapshotOptions,
  ) {
    if (!(circuit instanceof RootCircuit))
      throw new Error("toMatchDrawingSnapshot expects a RootCircuit")
    return toMatchSvgSnapshot.call(
      this,
      await getDrawingSnapshotSvg(circuit, options),
      testPath,
      undefined,
      { diffThresholdPercent: 0 },
    )
  },
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchDrawingSnapshot(
      testPath: string,
      options?: DrawingSnapshotOptions,
    ): Promise<void>
  }
}
