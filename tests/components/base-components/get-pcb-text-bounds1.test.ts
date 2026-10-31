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

test("getPcbTextBounds places the box below a top_left anchor, not above it", () => {
  // PCB world is +Y-up (consistent with Group_doInitialPcbComponentAnchorAlignment,
  // which defines top_left as { x: bounds.left, y: bounds.top } where
  // bounds.top = center.y + height / 2). So a "top_left" anchored box's
  // center must be BELOW the anchor by half the text height.
  const bounds = getPcbTextBounds(baseText)
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }

  expect(center.y).toBeCloseTo(baseText.anchor_position.y - bounds.height / 2)
  // The box's top edge (max Y) should sit at the anchor's Y.
  expect(bounds.y + bounds.height).toBeCloseTo(baseText.anchor_position.y)
})
