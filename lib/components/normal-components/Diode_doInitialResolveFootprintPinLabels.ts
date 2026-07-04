import { NormalComponent_doInitialResolveFootprintPinLabels } from "../base-components/NormalComponent/NormalComponent_doInitialResolveFootprintPinLabels"
import { isFootprinterString } from "../base-components/NormalComponent/utils/isFootprinterString"
import type { Diode } from "./Diode"

export function Diode_doInitialResolveFootprintPinLabels(component: Diode) {
  NormalComponent_doInitialResolveFootprintPinLabels(component)
  if (Object.keys(component._impliedFootprintPinLabels ?? {}).length > 0) {
    return
  }

  const footprint = component.resolveFootprint()
  const shouldAddDefaultAliases = !footprint || isFootprinterString(footprint)
  component._impliedFootprintPinLabels = {
    pin1: shouldAddDefaultAliases ? ["anode", "pos", "left"] : ["anode", "pos"],
    pin2: shouldAddDefaultAliases
      ? ["cathode", "neg", "right"]
      : ["cathode", "neg"],
  }

  NormalComponent_doInitialResolveFootprintPinLabels(component)
}
