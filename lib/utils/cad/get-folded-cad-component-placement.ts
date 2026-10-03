import { getReadablePcbFoldIssueMessage } from "./get-readable-pcb-fold-issue-message"
import {
  type CadComponentPlacement,
  transformCadComponentPlacement,
  PcbFoldError,
} from "@tscircuit/flex-utils"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { getBoardFoldContext } from "./get-board-fold-context"

/** Fold a CAD placement in Circuit JSON world coordinates (right-handed,
 * +X right, +Y top, +Z above, mm). Positions are points and rotations are
 * intrinsic XYZ degrees. An invalid rigid mount keeps its flat placement and
 * reports a PCB placement error so the rest of the circuit can render.
 * Unexpected transformation errors propagate.
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
    if (!(error instanceof PcbFoldError)) throw error
    const { db } = pcbComponentOwner.root!
    const component = db.pcb_component.get(pcbComponentOwner.pcb_component_id!)!
    const componentName =
      db.source_component.get(component.source_component_id)?.name ??
      "unnamed component"
    db.pcb_placement_error.insert({
      error_type: "pcb_placement_error",
      message: `Unable to fold CAD for PCB component ${componentName}; CAD remains flat: ${getReadablePcbFoldIssueMessage(error.issue, db.pcb_bend.list())}`,
      subcircuit_id:
        pcbComponentOwner.getSubcircuit()?.subcircuit_id ?? undefined,
    })
    return cadComponentPlacement
  }
}
