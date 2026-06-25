type SchPinLengthSource = {
  schPinLength?: unknown
}

export const getSchematicPinLength = (
  ...sources: Array<SchPinLengthSource | unknown>
): number | undefined => {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue
    const value = (source as SchPinLengthSource).schPinLength
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return value
    }
  }
  return undefined
}
