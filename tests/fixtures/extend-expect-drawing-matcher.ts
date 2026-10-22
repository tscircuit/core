import { expect } from "bun:test"
import { buildSubtree } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
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
    pixelsPerMm: options.pixelsPerMm ?? 2,
    supersampling: 1,
    resolveScene: async (view) => {
      const key = JSON.stringify([
        view.source_group_id,
        view.source_component_ids,
      ])
      const cached = scenes.get(key)
      if (cached) return cached
      const ids = new Set(view.source_component_ids)
      const selected: AnyCircuitElement[] = view.source_group_id
        ? buildSubtree(geometry, { source_group_id: view.source_group_id })
        : geometry.filter(
            (element) =>
              (element.type === "cad_component" ||
                element.type === "source_component") &&
              ids.has(element.source_component_id),
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
