import { expect, test } from "bun:test"
import type { PcbSilkscreenText } from "circuit-json"
import { getPcbTextBounds } from "lib/components/base-components/NormalComponent/utils/getPcbTextBounds"

const baseText: PcbSilkscreenText = {
  type: "pcb_silkscreen_text",
  pcb_silkscreen_text_id: "pcb_silkscreen_text_0",
  font: "tscircuit2024",
  font_size: 1,
  pcb_component_id: "pcb_component_0",
  text: "R1",
  layer: "top",
  anchor_position: { x: 10, y: 10 },
  anchor_alignment: "top_left",
}

test("getPcbTextBounds places the box above a bottom_left anchor, not below it", () => {
  // PCB world is +Y-up (consistent with Group_doInitialPcbComponentAnchorAlignment,
  // which defines bottom_left as { x: bounds.left, y: bounds.bottom } where
  // bounds.bottom = center.y - height / 2). So a "bottom_left" anchored box's
  // min-Y edge should sit exactly at the anchor's Y.
  const bottomText: PcbSilkscreenText = {
    ...baseText,
    anchor_alignment: "bottom_left",
  }
  const bounds = getPcbTextBounds(bottomText)

  expect(bounds.y).toBeCloseTo(bottomText.anchor_position.y)
})
