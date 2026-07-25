/**
 * Formats a resolved PCB offset for `display_offset_x` / `display_offset_y`.
 *
 * Those fields are described in circuit-json as "how to display the x offset
 * for this part, usually corresponding with how the user specified it", and are
 * typed `z.string().optional()`. Writing the raw number both fails schema
 * validation and loses the unit, so millimetres are made explicit here — the
 * same shape `Subpanel` already emits (`` `${x}mm` ``).
 *
 * A string the user supplied (e.g. `"3mm"`) is passed through unchanged, which
 * is what "corresponding with how the user specified it" asks for.
 */
export const formatDisplayOffset = (
  value: number | string | undefined | null,
): string | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string") return value
  if (!Number.isFinite(value)) return undefined
  return `${value}mm`
}
