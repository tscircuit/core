import type {
  AnyCircuitElement,
  CadComponent,
  PcbComponent,
} from "circuit-json"
import {
  loadCadComponentMesh,
  type CadComponentMeshOptions,
} from "circuit-json-to-gltf"
import {
  prepareCollisionMesh,
  createCollisionSolid,
} from "@tscircuit/cad-collision-checking"
import type { Manifold, ManifoldToplevel } from "@tscircuit/manifold-2d"
import { createCadCollisionSolid } from "./create-cad-collision-solid"

export type CollisionModelLoadOptions = Pick<
  CadComponentMeshOptions,
  "projectBaseUrl" | "authHeaders"
>

/** Load actual CAD geometry as right-handed circuit-world points in mm:
 * +X right, +Y top, +Z above. The exporter owns all imported/generated model
 * placement rules; the collision library owns mesh preparation/validation.
 * Native JSCAD retains its direct solid path. Caller owns the returned solid.
 */
export async function loadCadCollisionSolid(
  cad: CadComponent,
  circuitJson: AnyCircuitElement[],
  manifold: ManifoldToplevel,
  options: CollisionModelLoadOptions = {},
): Promise<Manifold> {
  if (
    cad.model_jscad &&
    !cad.model_stl_url &&
    !cad.model_obj_url &&
    !cad.model_glb_url &&
    !cad.model_gltf_url &&
    !cad.model_step_url
  )
    return createCadCollisionSolid(cad, circuitJson, manifold)
  const mesh = await loadCadComponentMesh(cad, {
    ...options,
    pcbComponent: circuitJson.find(
      (record): record is PcbComponent =>
        record.type === "pcb_component" &&
        record.pcb_component_id === cad.pcb_component_id,
    ),
  })
  return createCollisionSolid(
    prepareCollisionMesh(
      {
        numProp: 3,
        vertProperties: mesh.positions,
        triVerts: mesh.indices,
      },
      manifold,
    ),
    manifold,
  )
}
