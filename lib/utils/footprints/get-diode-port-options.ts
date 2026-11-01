import type { Diode } from "lib/components/normal-components/Diode"
import { isFootprinterString } from "lib/components/base-components/NormalComponent/utils/isFootprinterString"
import { resolveDiodeFootprint } from "./resolve-diode-footprint"

/** Shared port defaults for diodes and LEDs, including authored footprint handling. */
export const getDiodePortOptions = (
  diode: Pick<
    Diode,
    "children" | "name" | "resolveFootprint" | "_resolvePinLabels"
  >,
) => {
  const hasFootprintChild = diode.children.some(
    (child) => child.componentName === "Footprint",
  )
  const footprint = diode.resolveFootprint()
  const pinLabels = diode._resolvePinLabels()
  const hasPinLabels = Boolean(pinLabels)
  const shouldAddDefaultAliases =
    !hasPinLabels &&
    !hasFootprintChild &&
    (!footprint || isFootprinterString(footprint))

  const { positivePin, negativePin } =
    footprint && isFootprinterString(footprint)
      ? resolveDiodeFootprint(footprint, {
          name: diode.name,
          pinLabels,
        })
      : { positivePin: 1, negativePin: 2 }
  return {
    pinCount: 2,
    implicitPinLabels:
      shouldAddDefaultAliases && positivePin !== 1
        ? {
            [`pin${positivePin}`]: ["anode", "pos"],
            [`pin${negativePin}`]: ["cathode", "neg"],
          }
        : undefined,
    ignoreSymbolPorts: !hasPinLabels && !shouldAddDefaultAliases,
    additionalAliases: {
      [`pin${positivePin}`]: shouldAddDefaultAliases
        ? ["anode", "pos", positivePin === 1 ? "left" : "right"]
        : [],
      [`pin${negativePin}`]: shouldAddDefaultAliases
        ? ["cathode", "neg", negativePin === 1 ? "left" : "right"]
        : [],
    },
  }
}
