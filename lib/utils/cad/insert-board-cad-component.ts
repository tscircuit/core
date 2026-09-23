import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getCadFoldContext, transformCadComponent } from "@tscircuit/flex-utils"

/** Insert a board-mounted CAD pose after PCB layout and PcbFlexRender.
 * Input is flat Circuit JSON world space: right-handed, +Z above, mm for
 * position points and intrinsic XYZ degrees for rotation. The shared transform
 * uses the flat PCB mount to produce the assembled pose before insertion;
 * model-local geometry and all PCB coordinates remain unchanged.
 */
export function insertBoardCadComponent(
  db: CircuitJsonUtilObjects,
  flatCad: Parameters<CircuitJsonUtilObjects["cad_component"]["insert"]>[0],
) {
  if (!db.pcb_bend.list().length) return db.cad_component.insert(flatCad)

  // The temporary identifier is only a diagnostic label for fold validation.
  // The database assigns the actual CAD id on insertion below.
  const cad = {
    ...flatCad,
    type: "cad_component" as const,
    cad_component_id: flatCad.pcb_component_id ?? flatCad.source_component_id,
  }
  const context = getCadFoldContext(cad, db.toArray())
  if (!context?.fold.bends.length) return db.cad_component.insert(flatCad)
  const folded = transformCadComponent(cad, context, true)
  return db.cad_component.insert({
    ...flatCad,
    position: folded.position,
    rotation: folded.rotation,
    is_on_folded_board: true,
  })
}
