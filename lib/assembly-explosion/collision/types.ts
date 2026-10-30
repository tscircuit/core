import type {
  CadComponent,
  CadExplosionCollisionCheckWarning,
  CadExplosionCollisionError,
  CadExplosionCollisionObstacle,
  PcbBoard,
} from "circuit-json"
import type { Manifold } from "manifold-3d"

export type ExplosionCadId = CadComponent["cad_component_id"]
export type ExplosionBoardId = PcbBoard["pcb_board_id"]
export type AssemblyExplosionCollisionCheckStatus =
  | "not_checked"
  | "pending"
  | "checked"
  | "incomplete"

export interface AssemblyExplosionCollisionCheck {
  status: "checked" | "incomplete"
  errors: CadExplosionCollisionError[]
  warnings: CadExplosionCollisionCheckWarning[]
}

/** Solid and bounding-box points in right-handed circuit world, mm:
 * +X right, +Y top, +Z above. The checker owns and deletes the WASM solid. */
export interface ExplosionCollisionSolid {
  reference: CadExplosionCollisionObstacle
  sourceComponentId?: CadComponent["source_component_id"]
  name: string
  solid: Manifold
}
