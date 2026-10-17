import type { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import { resolvePcbProperty } from "./resolve-pcb-property"

/**
 * Returns the position a pcbSx `& silkscreentext` rule gives the text, relative
 * to its parent component. Coordinates are undefined when no rule sets them.
 */
export const resolveSilkscreenTextPcbSxPosition = (
  silkscreenText: SilkscreenText,
) => {
  const resolvedPcbSx = silkscreenText.getResolvedPcbSx()
  return {
    pcbX: resolvePcbProperty({
      propertyName: "pcbX",
      resolvedPcbSx,
      pathFromAmpersand: "silkscreentext",
      component: silkscreenText,
    }),
    pcbY: resolvePcbProperty({
      propertyName: "pcbY",
      resolvedPcbSx,
      pathFromAmpersand: "silkscreentext",
      component: silkscreenText,
    }),
  }
}
