import type { PinLabelsProp } from "@tscircuit/props"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import type { LayerRef, PcbSilkscreenText } from "circuit-json"

export const createPinrowSilkscreenText = ({
  elm,
  pinLabels,
  layer,
  anchorAlignment,
}: {
  elm: PcbSilkscreenText
  pinLabels: PinLabelsProp
  layer?: LayerRef
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
  const silkscreenText = new SilkscreenText({
    anchorAlignment: anchorAlignment || "center",
    text: label ?? pinNum,
    layer: layer || "top",
    pcbX: isNaN(elm.anchor_position.x) ? 0 : elm.anchor_position.x,
    pcbY: elm.anchor_position.y,
    pcbRotation: elm.ccw_rotation ?? 0,
  })
  silkscreenText._footprinterFontSize = elm.font_size + 0.2
  return silkscreenText
}
