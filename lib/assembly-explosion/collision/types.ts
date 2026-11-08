import type {
  CadComponent,
  CadExplosionCollisionCheckWarning,
  CadExplosionCollisionError,
  CadExplosionCollisionObstacle,
  Point3,
  PcbBoard,
} from "circuit-json"
import type { Manifold } from "@tscircuit/manifold-2d"

export type ExplosionCadId = CadComponent["cad_component_id"]
export type ExplosionBoardId = PcbBoard["pcb_board_id"]
export type AssemblyExplosionCollisionCheckStatus =
  | "not_checked"
  | "pending"
  | "checked"
  | "incomplete"

export type AssemblyExplosionVerificationCategory =
  | "verified_clear"
  | "unexpected_collision"
  | "annotated_unverified_contact"
  | "incomplete"

export interface CadGeometryStateModel {
  model_jscad?: unknown
  model_stl_url?: string
  model_obj_url?: string
  model_mtl_url?: string
  model_gltf_url?: string
  model_glb_url?: string
  model_step_url?: string
  model_wrl_url?: string
  model_3mf_url?: string
  model_asset?: unknown
  footprinter_string?: string
  position?: Point3
  rotation?: Point3
}

export interface ExplosionGeometryStateTransition {
  cad_component_id?: ExplosionCadId
  targetRef?: string
  fromState?: string
  toState: string
  /**
   * Whether swept/trajectory clearance for the state transition itself is verified.
   * Endpoint-only state swaps ("endpoint_only" or "unsupported") remain incomplete.
   */
  transitionVerification?: "verified" | "endpoint_only" | "unsupported"
}

export interface CadExplosionContactRegion {
  /**
   * Coordinate frame of the spatial contact bounding box (mm):
   * - "world": right-handed circuit-world XYZ (+X right, +Y top, +Z above)
   * - "obstacle": obstacle part-local XYZ relative to obstacle position at move start
   * - "moving": moving part-local XYZ relative to moving position at move start
   */
  frame?: "world" | "obstacle" | "moving"
  min: Point3
  max: Point3
}

export interface CadExplosionContactAnnotation {
  type?: "cad_explosion_contact_annotation"
  cad_explosion_contact_annotation_id?: string
  cad_explosion_move_id?: string
  cad_explosion_stage_id?: string
  stageRef?: string
  moveOrder?: number
  moving_cad_component_id?: ExplosionCadId
  movingTargetRef?: string
  obstacle_cad_component_id?: ExplosionCadId
  obstacle_pcb_board_id?: ExplosionBoardId
  obstacleTargetRef?: string
  region: CadExplosionContactRegion
  progressRange?: readonly [number, number]
  maxSweptVolumeMm3?: number
  rationale: string
  operation?: string
}

export interface AssemblyExplosionAnnotatedContact {
  verification_status: "annotated_unverified_contact"
  annotationId: string
  rationale: string
  operation?: string
  region: CadExplosionContactRegion
  worldRegion: { min: Point3; max: Point3 }
  measuredBounds: { min: Point3; max: Point3 }
  progressRange?: readonly [number, number]
  diagnostic: CadExplosionCollisionError
}

export interface AssemblyExplosionCollisionCheck {
  status: "checked" | "incomplete"
  verificationCategory: AssemblyExplosionVerificationCategory
  errors: CadExplosionCollisionError[]
  annotatedContacts: AssemblyExplosionAnnotatedContact[]
  warnings: CadExplosionCollisionCheckWarning[]
}

export interface AssemblyExplosionPolicyOptions {
  /**
   * Explicitly permit scoped annotated unverified contacts while still failing
   * any unexpected collision or incomplete/missing geometry verification.
   */
  allowAnnotatedContacts?: boolean
  allowAnnotatedUnverifiedContacts?: boolean
}

export interface AssemblyExplosionPolicyResult {
  passed: boolean
  verificationCategory: AssemblyExplosionVerificationCategory
  blockingErrors: CadExplosionCollisionError[]
  unacknowledgedAnnotatedContacts: AssemblyExplosionAnnotatedContact[]
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
