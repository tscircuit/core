import { expect, test } from "bun:test"
import { loadCollisionManifold } from "@tscircuit/cad-collision-checking"
import { loadCadCollisionSolid } from "lib/assembly-explosion/collision/load-cad-collision-solid"
import { loadRp2040ExplosionFixture } from "./fixtures/rp2040-explosion/load-fixture"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { createSceneFromGLTF, loadGLTFWithResourcesFromURL } from "poppygl"
import { vec3 } from "gl-matrix"

test("imported and generated collision meshes match emitted geometry with rotated bottom placement and nonzero origins", async () => {
  const fixture = await loadRp2040ExplosionFixture()
  const source = fixture.find(
    (r) => r.type === "source_component" && r.name === "bolt1",
  )!
  if (source.type !== "source_component") throw Error("Missing bolt source")
  const original = fixture.find(
    (r) =>
      r.type === "cad_component" &&
      r.source_component_id === source.source_component_id,
  )!
  if (original.type !== "cad_component") throw Error("Missing bolt model")
  const manifold = await loadCollisionManifold()
  for (const generated of [false, true])
    for (const layer of ["top", "bottom"] as const)
      for (const z of [0, 90, 180, 270]) {
        const cad = {
          ...original,
          model_obj_url: generated ? undefined : original.model_obj_url,
          footprinter_string: generated ? "cap0402" : undefined,
          position: { x: 12, y: -7, z: 4 },
          rotation: { x: 23, y: 31 + (layer === "bottom" ? 180 : 0), z },
          layer,
          model_origin_position: { x: 1, y: 2, z: 3 },
          model_unit_to_mm_scale_factor: 1.5,
          size: { x: 12, y: 7, z: 40 },
          model_object_fit: "contain_within_bounds" as const,
          model_board_normal_direction:
            z === 90 ? ("y-" as const) : ("z+" as const),
        }
        const solid = await loadCadCollisionSolid(cad, [cad], manifold)
        try {
          const glb = await convertCircuitJsonToGltf([cad], {
            format: "glb",
            includeModels: true,
          })
          const { gltf, resources } = await loadGLTFWithResourcesFromURL(
            `data:model/gltf-binary;base64,${Buffer.from(glb as Uint8Array).toString("base64")}`,
          )
          const scene = createSceneFromGLTF(gltf, resources)
          const points: number[][] = []
          for (const draw of scene.drawCalls)
            for (let i = 0; i < draw.positions.length; i += 3) {
              const world = vec3.transformMat4(
                vec3.create(),
                [
                  draw.positions[i],
                  draw.positions[i + 1],
                  draw.positions[i + 2],
                ],
                draw.model,
              )
              points.push([-world[0], world[2], world[1]])
            }
          const mesh = solid.getMesh()
          // Test vertices from emitted geometry, not a restatement of placement math.
          const stride =
            Math.max(1, Math.floor(mesh.numVert / 40)) * mesh.numProp
          for (let i = 0; i < mesh.vertProperties.length; i += stride) {
            const point = Array.from(mesh.vertProperties.slice(i, i + 3))
            expect(
              Math.min(
                ...points.map((p) =>
                  Math.hypot(...p.map((v, axis) => v - point[axis])),
                ),
              ),
            ).toBeLessThan(0.00005)
          }
        } finally {
          solid.delete()
        }
      }
}, 30000)
