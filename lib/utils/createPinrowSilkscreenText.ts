import type { PinLabelsProp } from "@tscircuit/props"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import type { LayerRef, PcbSilkscreenText } from "circuit-json"

export const createPinrowSilkscreenText = ({
  elm,
  pinLabels,
  layer,
  readableRotation,
  anchorAlignment,
}: {
  elm: PcbSilkscreenText
  pinLabels: PinLabelsProp
  layer?: LayerRef
  readableRotation: number
  anchorAlignment?: PcbSilkscreenText["anchor_alignment"]
}) => {
  const pinNum = elm.text.replace(/[{}]/g, "").toLowerCase()

  let label: string = pinNum
  if (Array.isArray(pinLabels)) {
    const index = parseInt(pinNum.replace(/[^\d]/g, ""), 10) - 1
    label = String(pinLabels[index] ?? pinNum)
  } else if (typeof pinLabels === "object") {
    label = String(pinLabels[pinNum] ?? pinNum)
  }

  // Normalize rotation to keep text readable (horizontal or vertical)
  // Snap to nearest 90-degree angle to keep text axis-aligned
  let normalizedRotation = ((readableRotation % 360) + 360) % 360
  normalizedRotation = Math.round(normalizedRotation / 90) * 90

  // Ensure text is readable (not upside-down)
  // Keep text at 0° or 90° only, avoiding 180° and 270°
  if (normalizedRotation === 180) {
    normalizedRotation = 0
  } else if (normalizedRotation === 270) {
    normalizedRotation = 90
  }

  return new SilkscreenText({
    anchorAlignment: anchorAlignment || "center",
    text: label ?? pinNum,
    layer: layer || "top",
    fontSize: elm.font_size + 0.2,
    pcbX: isNaN(elm.anchor_position.x) ? 0 : elm.anchor_position.x,
    pcbY: elm.anchor_position.y,
    pcbRotation: normalizedRotation,
  })
}
