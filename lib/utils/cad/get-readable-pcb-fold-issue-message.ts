import type { PcbFoldIssue } from "@tscircuit/flex-utils"
import type { PcbBend } from "circuit-json"

const reasons: Record<PcbFoldIssue["code"], string> = {
  invalid_bend_geometry: "Invalid bend geometry",
  unsupported_bend_geometry: "Unsupported bend geometry",
  nonparallel_bends: "Bends must be parallel with the same moving direction",
  overlapping_bend_zones:
    "Overlapping PCB bend zones or incompatible moving regions are not supported",
  invalid_finite_bend_region:
    "The bend does not define a valid finite moving region",
  incomplete_bend_cross_section:
    "The bend cross-section does not cover the board",
  rigid_bend_zone_intersection: "CAD mount intersects PCB bend zone",
}

/** Format typed fold failures with user-facing names. The helper's raw message
 * may contain database IDs, which belong only in diagnostic reference fields. */
export function getReadablePcbFoldIssueMessage(
  issue: PcbFoldIssue,
  bends: PcbBend[],
): string {
  const reason = reasons[issue.code]
  if (!issue.bendId) return reason
  const bend = bends.find((bend) => bend.pcb_bend_id === issue.bendId)
  return `${reason} ${bend?.name ?? "unnamed bend"}`
}
