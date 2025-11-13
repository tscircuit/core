import type { PinLabelsProp } from "@tscircuit/props"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import type { LayerRef, PcbSilkscreenText } from "circuit-json"

const FONT_SIZE_INCREASE_MM = 0.2
const LABEL_OFFSET_MM = 0.5

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

  const anchorX = isNaN(elm.anchor_position.x) ? 0 : elm.anchor_position.x
  const anchorY = elm.anchor_position.y

  const normalizedRotation = ((readableRotation % 360) + 360) % 360
  const isAxisAligned =
    normalizedRotation === 0 ||
    normalizedRotation === 90 ||
    normalizedRotation === 180 ||
    normalizedRotation === 270

  let offsetX = 0
  let offsetY = 0
  if (!isAxisAligned) {
    const angleRad = (readableRotation * Math.PI) / 180
    offsetX = -Math.cos(angleRad) * LABEL_OFFSET_MM
    offsetY = -Math.sin(angleRad) * LABEL_OFFSET_MM
  }

  return new SilkscreenText({
    anchorAlignment: anchorAlignment || "center",
    text: label ?? pinNum,
    layer: layer || "top",
    fontSize: elm.font_size + FONT_SIZE_INCREASE_MM,
    pcbX: anchorX + offsetX,
    pcbY: anchorY + offsetY,
    pcbRotation: readableRotation,
  })
}
