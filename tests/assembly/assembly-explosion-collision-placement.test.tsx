import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { createSceneFromGLTF, loadGLTFWithResourcesFromURL } from "poppygl"
import { vec3 } from "gl-matrix"
import { createCadCollisionSolid } from "lib/assembly-explosion/collision/create-cad-collision-solid"
import { loadCollisionManifold } from "@tscircuit/cad-collision-checking"

test("collision model placement matches emitted glTF with nonzero origins, units, fit and compound rotations", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="PLACEMENT">
      <assembly.part
        name="ASYMMETRIC"
        cadModel={{
          jscad: { type: "cuboid", size: [6, 4, 2], center: [1, 2, 3] },
          positionOffset: { x: 12, y: -7, z: 4 },
          modelOriginPosition: { x: 1, y: 2, z: 3 },
          modelUnitToMmScale: 1.5,
          size: { x: 12, y: 7, z: 3 },
        }}
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const manifold = await loadCollisionManifold()
  for (const layer of ["top", "bottom"] as const)
    for (const z of [0, 90, 180, 270, 47]) {
      const json = structuredClone(circuit.getCircuitJson())
      const cad = json.find((r) => r.type === "cad_component")!
      cad.layer = layer
      cad.rotation = { x: 23, y: 31 + (layer === "bottom" ? 180 : 0), z }
      cad.model_object_fit = z === 47 ? "fill_bounds" : "contain_within_bounds"
      cad.model_board_normal_direction = z === 90 ? "y-" : "z+"
      const solid = createCadCollisionSolid(cad, json, manifold)
      try {
        const glb = await convertCircuitJsonToGltf(json, {
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
              [draw.positions[i], draw.positions[i + 1], draw.positions[i + 2]],
              draw.model,
            )
            points.push([-world[0], world[2], world[1]])
          }
        const mesh = solid.getMesh()
        for (let i = 0; i < mesh.vertProperties.length; i += mesh.numProp) {
          const point = [
            mesh.vertProperties[i],
            mesh.vertProperties[i + 1],
            mesh.vertProperties[i + 2],
          ]
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
})
