import { expect, test } from "bun:test"
import { updatePlatedHoleRotationsAfterTransform } from "lib/components/primitive-components/Group/Group_doInitialPcbLayoutPack/applyPackOutput"

test("pack rotation propagates to plated-hole orientation fields", () => {
  const updates: Array<{ id: string; update: Record<string, number> }> = []
  const db = {
    pcb_plated_hole: {
      update: (id: string, update: Record<string, number>) => {
        updates.push({ id, update })
      },
    },
  }

  updatePlatedHoleRotationsAfterTransform({
    db: db as any,
    rotationDegrees: 90,
    elements: [
      {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: "oval",
        ccw_rotation: 0,
      },
      {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: "pill-with-pad",
        hole_ccw_rotation: 270,
        rect_ccw_rotation: 15,
      },
      { type: "pcb_smtpad", pcb_smtpad_id: "pad" },
    ],
  })

  expect(updates).toEqual([
    { id: "oval", update: { ccw_rotation: 90 } },
    {
      id: "pill-with-pad",
      update: { hole_ccw_rotation: 0, rect_ccw_rotation: 105 },
    },
  ])
})
