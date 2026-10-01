import {
  type CadComponentPlacement,
  transformCadComponentPlacement,
} from "@tscircuit/flex-utils"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { getBoardFoldContext } from "./get-board-fold-context"

/** Fold a CAD placement in Circuit JSON world coordinates (right-handed,
 * +X right, +Y top, +Z above, mm). Positions are points and rotations are
 * intrinsic XYZ degrees. An invalid rigid mount keeps its flat placement and
 * reports a PCB placement error so the rest of the circuit can render.
 */
export function getFoldedCadComponentPlacement<T extends CadComponentPlacement>(
  pcbComponentOwner: PrimitiveComponent,
  cadComponentPlacement: T,
): T {
  const boardFoldContext = getBoardFoldContext(pcbComponentOwner)
  if (!boardFoldContext) return cadComponentPlacement
  try {
    return transformCadComponentPlacement(
      { cadComponentPlacement, foldPcbs: true },
      boardFoldContext,
    )
  } catch (error) {
    pcbComponentOwner.root!.db.pcb_placement_error.insert({
      error_type: "pcb_placement_error",
      message: `Unable to fold CAD for PCB component ${pcbComponentOwner.pcb_component_id}; CAD remains flat: ${error instanceof Error ? error.message : String(error)}`,
      subcircuit_id:
        pcbComponentOwner.getSubcircuit()?.subcircuit_id ?? undefined,
    })
    return cadComponentPlacement
  }
}
