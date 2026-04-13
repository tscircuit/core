import type { AnyCircuitElement } from "circuit-json"

/**
 * The canonical USB-C pin labels every USB-C connector's schematic symbol
 * should display, regardless of manufacturer. These are the targets ports
 * are matched against. The order matters: earlier labels get first pick
 * when multiple unassigned ports could match. Aliases are alternative
 * names manufacturers may use in their circuit JSON (e.g. "DN1" for "DM1").
 */
const STANDARD_USB_C_PIN_LABELS: Array<{ label: string; aliases: string[] }> = [
  { label: "GND1", aliases: [] },
  { label: "VBUS1", aliases: [] },
  { label: "CC1", aliases: [] },
  { label: "DP1", aliases: [] },
  { label: "DM1", aliases: ["DN1"] },
  { label: "SBU1", aliases: [] },
  { label: "SBU2", aliases: [] },
  { label: "DM2", aliases: ["DN2"] },
  { label: "DP2", aliases: [] },
  { label: "CC2", aliases: [] },
  { label: "VBUS2", aliases: [] },
  { label: "GND2", aliases: [] },
  { label: "SHELL1", aliases: ["MH1", "EH1", "MOUNT1"] },
  { label: "SHELL2", aliases: ["MH2", "EH2", "MOUNT2"] },
  { label: "SHELL3", aliases: ["MH3", "EH3", "MOUNT3"] },
  { label: "SHELL4", aliases: ["MH4", "EH4", "MOUNT4"] },
]

/**
 * Match the ports in a part's circuit JSON against the canonical USB-C
 * pin labels. The standard labels are the target; the circuit JSON is the
 * subject being matched. For each standard signal, we scan the part's
 * source_ports for one whose `port_hints` contain the label (or an
 * alias), record the match as a `pin${pin_number} → <label>` entry, and
 * consume that port so it cannot match another signal.
 *
 * The output is ready to use as `additionalAliases`, so every USB-C
 * connector's schematic symbol displays the same canonical pin labels
 * regardless of manufacturer.
 */
export const getStandardUsbCPinLabels = (
  circuitJson: AnyCircuitElement[],
): Record<`pin${number}`, string> => {
  const unassignedPorts: Array<{
    pinNumber: number
    upperCaseHints: Set<string>
  }> = []
  for (const elm of circuitJson) {
    if (!elm || typeof elm !== "object") continue
    if ((elm as any).type !== "source_port") continue
    const pinNumber = (elm as any).pin_number
    if (typeof pinNumber !== "number") continue
    const rawHints = (elm as any).port_hints
    const upperCaseHints = new Set<string>()
    if (Array.isArray(rawHints)) {
      for (const hint of rawHints) {
        if (typeof hint === "string")
          upperCaseHints.add(hint.trim().toUpperCase())
      }
    }
    unassignedPorts.push({ pinNumber, upperCaseHints })
  }

  const pinLabels: Record<`pin${number}`, string> = {}
  for (const { label, aliases } of STANDARD_USB_C_PIN_LABELS) {
    const labelAndAliasesUpper = [label, ...aliases].map((s) => s.toUpperCase())
    const matchIndex = unassignedPorts.findIndex((port) =>
      labelAndAliasesUpper.some((name) => port.upperCaseHints.has(name)),
    )
    if (matchIndex === -1) continue
    const { pinNumber } = unassignedPorts[matchIndex]
    pinLabels[`pin${pinNumber}`] = label
    unassignedPorts.splice(matchIndex, 1)
  }

  return pinLabels
}
