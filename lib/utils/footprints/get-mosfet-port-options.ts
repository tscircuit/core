import type { Mosfet } from "lib/components/normal-components/Mosfet"
import { parseFootprinterDefinition } from "./parse-footprinter-definition"

/** Common SOT-23 MOSFETs (AO3400, BSS138, 2N7002) number pins 1=G, 2=S, 3=D. */
const SOT23_MOSFET_PIN_LABELS: Record<string, string[]> = {
  pin1: ["gate"],
  pin2: ["source"],
  pin3: ["drain"],
}

/** Shared port defaults for mosfets on known packages. */
export const getMosfetPortOptions = (
  mosfet: Pick<Mosfet, "resolveFootprint">,
) => {
  let isThreePinSot23 = false
  try {
    const parsed = parseFootprinterDefinition(mosfet.resolveFootprint())
    if (parsed?.parameters.fn === "sot23") {
      const pinCount = Number(
        parsed.parameters.string?.match(/^sot23_(\d+)/i)?.[1] ?? 3,
      )
      isThreePinSot23 = pinCount === 3
    }
  } catch {}
  return {
    pinCount: 3,
    implicitPinLabels: isThreePinSot23 ? SOT23_MOSFET_PIN_LABELS : undefined,
  }
}
