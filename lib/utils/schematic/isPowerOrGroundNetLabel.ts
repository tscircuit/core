export const isPowerOrGroundNetLabel = (
  text: string | undefined | null,
): boolean => {
  if (!text) return false
  const s = String(text).trim().toLowerCase()
  if (s.length === 0) return false
  // Treat nets starting with "gnd" or "v" as power
  // Examples: GND, GND1, VCC, V_3V3, VBUS, V5, etc.
  return s.startsWith("gnd") || s.startsWith("v")
}
