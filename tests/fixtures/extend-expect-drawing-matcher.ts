import { expect } from "bun:test"
import { getDrawingViewGeometry } from "lib/components/primitive-components/get-drawing-view-geometry"
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
