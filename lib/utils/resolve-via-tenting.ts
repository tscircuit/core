import type { ViaProps } from "@tscircuit/props"
import type { PcbVia } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { PcbViaProps } from "lib/components/primitive-components/PcbVia"

const resolveTentingMode = (
  tented: ViaProps["tented"],
): Pick<PcbVia, "tented_on_top" | "tented_on_bottom"> => {
  if (tented === undefined) return {}
  const bothSides =
    tented === true ||
    tented === "both_sides" ||
    tented === "top_and_bottom_tented"
  return {
    tented_on_top: bothSides || tented === "top_tented",
    tented_on_bottom: bothSides || tented === "bottom_tented",
  }
}

export const resolveViaTenting = (
  component: Pick<PrimitiveComponent, "_getBoard">,
  {
    tented,
    tentedOnTop,
    tentedOnBottom,
    isTented,
  }: Pick<
    PcbViaProps,
    "tented" | "tentedOnTop" | "tentedOnBottom" | "isTented"
  > = {},
  isFlipped = false,
): Pick<PcbVia, "tented_on_top" | "tented_on_bottom"> => {
  const boardTenting = resolveTentingMode(
    component._getBoard()?._parsedProps.defaultViaTenting,
  )
  const viaTenting = resolveTentingMode(tented)
  const top = tentedOnTop ?? viaTenting.tented_on_top ?? isTented
  const bottom = tentedOnBottom ?? viaTenting.tented_on_bottom ?? isTented

  // Explicit sides follow PrimitiveComponent._getPcbPrimitiveFlippedHelpers()
  // from footprint-local to board faces. Board defaults already name board faces.
  return {
    tented_on_top: (isFlipped ? bottom : top) ?? boardTenting.tented_on_top,
    tented_on_bottom:
      (isFlipped ? top : bottom) ?? boardTenting.tented_on_bottom,
  }
}
