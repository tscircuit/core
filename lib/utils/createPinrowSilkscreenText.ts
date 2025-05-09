import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"

export const createPinrowSilkscreenText = ({
  elm,
  pinLabels,
  readableRotation,
}: { elm: any; pinLabels: any; readableRotation: number | undefined }) => {
  const pinNum = elm.text.replace(/[{}]/g, "").toLowerCase()

  let label = pinNum
  if (Array.isArray(pinLabels)) {
    const index = parseInt(pinNum.replace(/[^\d]/g, ""), 10) - 1
    label = pinLabels[index] ?? pinNum
  } else if (typeof pinLabels === "object") {
    label = pinLabels[pinNum]?.[0] ?? pinNum
  }

  return new SilkscreenText({
    anchorAlignment: "center",
    text: label,
    fontSize: elm.font_size + 0.2,
    pcbX: isNaN(elm.anchor_position.x) ? 0 : elm.anchor_position.x,
    pcbY: elm.anchor_position.y,
    pcbRotation: readableRotation ?? 0,
  })
}
