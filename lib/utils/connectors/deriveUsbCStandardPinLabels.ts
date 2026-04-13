import type { AnyCircuitElement } from "circuit-json"

/**
 * Ordered list of standard USB-C signal labels with known aliases. The order
 * matters: labels earlier in the list get first pick when scanning the
 * source_port pool.
 */
const STANDARD_USB_C_SIGNALS: Array<{ label: string; aliases: string[] }> = [
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
 * Derive standard USB-C pin labels by matching each canonical signal against
 * the source_ports' port_hints in the fetched part circuit JSON.
 *
 * Algorithm (greedy):
 *   for each standard signal in order:
 *     scan remaining source_port pool
 *     find first port whose hints contain the signal label or any alias
 *     assign `pin${pin_number}: <signal>` and remove port from pool
 *
 * Result: `{ pin5: "SBU2", pin6: "CC1", pin13: "GND1", ... }` — always the
 * same labels for any USB-C part, regardless of manufacturer pin numbering.
 */
export const deriveUsbCStandardPinLabels = (
  circuitJson: AnyCircuitElement[],
): Record<string, string> => {
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

  const pinLabels: Record<string, string> = {}
  for (const { label, aliases } of STANDARD_USB_C_SIGNALS) {
    const matchTargets = [label, ...aliases].map((s) => s.toUpperCase())
    const matchIndex = unassignedPorts.findIndex((port) =>
      matchTargets.some((target) => port.upperCaseHints.has(target)),
    )
    if (matchIndex === -1) continue
    const { pinNumber } = unassignedPorts[matchIndex]
    pinLabels[`pin${pinNumber}`] = label
    unassignedPorts.splice(matchIndex, 1)
  }

  return pinLabels
}
