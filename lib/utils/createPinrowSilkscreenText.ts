import type { PinLabelsProp } from "@tscircuit/props"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import type { LayerRef, PcbSilkscreenText } from "circuit-json"

export const createPinrowSilkscreenText = ({
  elm,
  pinLabels,
  readableRotation,
  anchorAlignment,
  layer,
}: {
  elm: PcbSilkscreenText
  pinLabels: PinLabelsProp
  readableRotation: number
  anchorAlignment?: PcbSilkscreenText["anchor_alignment"]
  layer?: LayerRef
}) => {
  const pinNum = elm.text.replace(/[{}]/g, "").toLowerCase()

  let label = pinNum
  if (Array.isArray(pinLabels)) {
    const index = parseInt(pinNum.replace(/[^\d]/g, ""), 10) - 1
    label = pinLabels[index] ?? pinNum
  } else if (typeof pinLabels === "object") {
    label = pinLabels[pinNum]?.[0] ?? pinNum
  }

  return new SilkscreenText({
    anchorAlignment: anchorAlignment || "center",
    layer: layer || "top",
    text: label ?? pinNum,
    fontSize: elm.font_size + 0.2,
    pcbX: isNaN(elm.anchor_position.x) ? 0 : elm.anchor_position.x,
    pcbY: elm.anchor_position.y,
    pcbRotation: readableRotation ?? 0,
  })
}
