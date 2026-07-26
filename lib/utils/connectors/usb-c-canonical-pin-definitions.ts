/**
 * Canonical logical pins exposed by a standard USB-C connector. Array order is
 * also the stable fallback pin-number order when no physical part can be
 * resolved.
 */
export const STANDARD_USB_C_PIN_LABELS = [
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
] as const
