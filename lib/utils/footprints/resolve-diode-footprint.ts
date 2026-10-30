import { resolvePassiveFootprintDefinition } from "@tscircuit/footprinter"
import type { PinLabelsProp } from "@tscircuit/props"
import { parseFootprinterDefinition } from "./parse-footprinter-definition"
import { resolveTwoTerminalPinMapping } from "./resolve-two-terminal-pin-mapping"

/** Diode and LED packages share A/K terminal and Footprinter artwork rules. */
export const resolveDiodeFootprint = (
  footprint: string,
  { name, pinLabels }: { name: string; pinLabels?: PinLabelsProp },
) => {
  const parsed = parseFootprinterDefinition(footprint)
  if (!parsed) return { footprint, positivePin: 1, negativePin: 2 }
  const { definition, parameters } = parsed
  const terminals = resolveTwoTerminalPinMapping({
    name,
    pinLabels,
    explicitPositive: parameters.anodepin,
    explicitNegative: parameters.cathodepin,
    positiveOption: "anodepin",
    negativeOption: "cathodepin",
    defaultPositivePin: ["do219ad", "sod323he"].includes(parameters.fn) ? 2 : 1,
  })
  let resolved = resolvePassiveFootprintDefinition(definition, {
    defaultFamily: "diode",
  })
  if (
    terminals.hasPolarityLabels ||
    (parameters.fn === "smdpads" && parameters.num_pins === 2)
  ) {
    if (parameters.anodepin === undefined)
      resolved += `_anodepin${terminals.positivePin}`
    if (parameters.cathodepin === undefined)
      resolved += `_cathodepin${terminals.negativePin}`
  }
  return { ...terminals, footprint: resolved }
}
