import {
  checkStaticCollisions,
  loadCollisionManifold,
  serializeCollisionMesh,
  type CollisionSolid,
} from "@tscircuit/cad-collision-checking"
import type { Manifold } from "@tscircuit/manifold-2d"
import {
  cad_assembly_collision_check_warning,
  cad_assembly_collision_error,
  type AnyCircuitElement,
  type CadAssemblyCollisionCheckWarning,
  type CadAssemblyCollisionError,
} from "circuit-json"
import { createBoardCollisionSolid } from "./collision/create-board-collision-solid"
import { getAssemblyBoardCollisionGeometry } from "./collision/get-assembly-board-collision-geometry"
import {
  loadCadCollisionSolid,
  type CollisionModelLoadOptions,
} from "./collision/load-cad-collision-solid"

/** Check PCB substrates against printed assembly parts in the assembled pose.
 * Mesh points are right-handed circuit-world mm: +X right, +Y top, +Z above.
 */
export async function checkCircuitJsonAssemblyCollisions(
  circuitJson: AnyCircuitElement[],
  options: CollisionModelLoadOptions,
) {
  const geometry = getAssemblyBoardCollisionGeometry(circuitJson)
  const boards = new Map(
    geometry.boards.map((board) => [board.pcb_board_id, board]),
  )
  const mechanical = new Map(
    geometry.cad.map((cad) => [cad.cad_component_id, cad]),
  )

  const errors: CadAssemblyCollisionError[] = []
  const warnings: CadAssemblyCollisionCheckWarning[] = []
  const solids: CollisionSolid[] = []
  const getName = (cad: (typeof geometry.cad)[number]) =>
    geometry.printedParts.get(cad.source_component_id)?.name ||
    "unnamed printed part"
  const addSolid = (
    entry: Pick<CollisionSolid, "solidId" | "name">,
    solid: Manifold,
  ) => {
    try {
      solids.push({ ...entry, mesh: serializeCollisionMesh(solid) })
    } finally {
      solid.delete()
    }
  }

  const manifold = await loadCollisionManifold()
  for (const [pcb_board_id, board] of boards) {
    try {
      const solid = createBoardCollisionSolid(board, circuitJson, manifold)
      if (!solid) throw new Error("PCB has no closed substrate geometry")
      addSolid({ solidId: pcb_board_id, name: "PCB" }, solid)
    } catch {
      warnings.push(
        cad_assembly_collision_check_warning.parse({
          type: "cad_assembly_collision_check_warning",
          cad_component_ids: [],
          pcb_board_ids: [pcb_board_id],
          reason: "invalid_geometry",
          message:
            "Assembled collision checking could not load closed geometry for the PCB",
        }),
      )
    }
  }
  for (const [cad_component_id, cad] of mechanical) {
    const name = getName(cad)
    try {
      const solid = await loadCadCollisionSolid(
        cad,
        circuitJson,
        manifold,
        options,
      )
      addSolid({ solidId: cad_component_id, name }, solid)
    } catch {
      warnings.push(
        cad_assembly_collision_check_warning.parse({
          type: "cad_assembly_collision_check_warning",
          cad_component_ids: [cad_component_id],
          pcb_board_ids: [],
          reason: "invalid_geometry",
          message: `Assembled collision checking could not load closed geometry for "${name}"`,
        }),
      )
    }
  }

  for (const collision of checkStaticCollisions(solids, { manifold })) {
    const [firstId, secondId] = collision.solidIds
    const board = boards.get(firstId) ?? boards.get(secondId)
    const cad = mechanical.get(firstId) ?? mechanical.get(secondId)
    if (!board || !cad) continue
    const volume = collision.intersectionVolumeMm3
    errors.push(
      cad_assembly_collision_error.parse({
        type: "cad_assembly_collision_error",
        pcb_board_id: board.pcb_board_id,
        cad_component_id: cad.cad_component_id,
        source_component_ids: [cad.source_component_id],
        intersection_volume_mm3: volume,
        message: `Assembled part "${getName(cad)}" overlaps the PCB (${Number(volume.toPrecision(5))} mm³)`,
        is_fatal: true,
      }),
    )
  }
  return { errors, warnings }
}
