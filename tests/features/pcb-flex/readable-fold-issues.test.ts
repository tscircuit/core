import { expect, test } from "bun:test"
import type { PcbFoldIssue } from "@tscircuit/flex-utils"
import type { PcbBend } from "circuit-json"
import { getReadablePcbFoldIssueMessage } from "lib/utils/cad/get-readable-pcb-fold-issue-message"

test("all typed fold reasons use readable bend names instead of raw helper messages", () => {
  const bend: PcbBend = {
    type: "pcb_bend",
    pcb_bend_id: "pcb_bend_private_91",
    pcb_board_id: "pcb_board_private_92",
    name: "CONTACT_FOLD",
    start: { x: 0, y: -6 },
    end: { x: 0, y: 6 },
    bend_angle: 90,
    bend_radius: 1,
    bend_side: "left",
  }
  const codes: PcbFoldIssue["code"][] = [
    "invalid_bend_geometry",
    "unsupported_bend_geometry",
    "nonparallel_bends",
    "overlapping_bend_zones",
    "invalid_finite_bend_region",
    "incomplete_bend_cross_section",
    "rigid_bend_zone_intersection",
  ]
  for (const code of codes) {
    const issue: PcbFoldIssue = {
      code,
      bendId: bend.pcb_bend_id,
      message: `Raw failure for ${bend.pcb_bend_id}`,
    }
    expect(getReadablePcbFoldIssueMessage(issue, [bend])).toContain(
      "CONTACT_FOLD",
    )
    expect(
      getReadablePcbFoldIssueMessage(issue, [{ ...bend, name: undefined }]),
    ).toContain("unnamed bend")
    expect(getReadablePcbFoldIssueMessage(issue, [])).not.toContain(
      bend.pcb_bend_id,
    )
    expect(
      getReadablePcbFoldIssueMessage({ ...issue, bendId: undefined }, []),
    ).not.toContain(bend.pcb_bend_id)
  }
})
