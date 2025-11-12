import type { PinLabelsProp } from "@tscircuit/props"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import type { LayerRef, PcbSilkscreenText } from "circuit-json"

const DIAGONAL_OFFSET_MM = 0.6
const FONT_SIZE_INCREASE_MM = 0.2

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

  let normalizedRotation = ((readableRotation % 360) + 360) % 360
  normalizedRotation = Math.round(normalizedRotation / 90) * 90

  if (normalizedRotation === 180) {
    normalizedRotation = 0
  } else if (normalizedRotation === 270) {
    normalizedRotation = 90
  }

  const normalizedReadable = ((readableRotation % 360) + 360) % 360
  let rotationDiff = Math.abs(normalizedReadable - normalizedRotation)

  if (rotationDiff > 180) {
    rotationDiff = 360 - rotationDiff
  }

  const needsOffset =
    (rotationDiff > 20 && rotationDiff < 70) ||
    (rotationDiff > 110 && rotationDiff < 160)
  const offsetDistanceMm = needsOffset ? DIAGONAL_OFFSET_MM : 0

  let offsetXMm = 0
  let offsetYMm = 0
  if (needsOffset) {
    const angleRad = (normalizedReadable * Math.PI) / 180
    offsetXMm = Math.cos(angleRad) * offsetDistanceMm
    offsetYMm = Math.sin(angleRad) * offsetDistanceMm
  }

  return new SilkscreenText({
    anchorAlignment: anchorAlignment || "center",
    text: label ?? pinNum,
    layer: layer || "top",
    fontSize: elm.font_size + FONT_SIZE_INCREASE_MM,
    pcbX:
      (isNaN(elm.anchor_position.x) ? 0 : elm.anchor_position.x) - offsetXMm,
    pcbY: elm.anchor_position.y - offsetYMm,
    pcbRotation: normalizedRotation,
  })
}
