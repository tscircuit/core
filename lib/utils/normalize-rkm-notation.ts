/**
 * Normalize RKM / IEC 60062 notation into a plain decimal + SI-prefix form
 * that `format-si-unit`'s `parseAndConvertSiUnit` understands.
 *
 * RKM notation replaces the decimal point with the SI prefix letter, e.g.
 *   "4k7"  -> 4.7 kΩ  -> "4.7k"
 *   "2u2"  -> 2.2 µF   -> "2.2u"
 *   "1R5"  -> 1.5 Ω    -> "1.5R"
 *   "1meg" -> 1 MΩ     -> "1M"
 *
 * `parseAndConvertSiUnit` reads only the number before the first letter and
 * ignores the trailing digits, so "4k7" is silently parsed as 4000 instead of
 * 4700. This function rewrites the value so the fractional digits are kept.
 *
 * See tscircuit/core issue #5806.
 */

// SI prefix letters used in RKM notation. "R" (and "Ω") stand for ohms and
// carry no multiplier. "meg" is SPICE's mega. Case is preserved so that
// "m" (milli) and "M" (mega) stay distinct.
const RKM_PREFIXES = [
  "meg", // SPICE mega, must be checked before single letters
  "µ",
  "μ",
  "Ω",
  "R",
  "r",
  "k",
  "K",
  "M",
  "G",
  "T",
  "P",
  "p",
  "n",
  "N",
  "u",
  "U",
  "m",
  "f",
  "F",
  "a",
  "A",
  "z",
  "Z",
  "y",
  "Y",
] as const

// Matches: <integer digits><prefix letter><trailing digits>
// e.g. "4k7", "1R5", "2u2", "1meg5". The integer part is required so that
// plain decimals like "4.7k" (which already contain a ".") are left untouched.
// Note: "m" (milli) and "M" (mega) are both included and case-sensitive.
const RKM_PATTERN = /^(\d+)(meg|µ|μ|Ω|[RrKkMmGGTpPnNuUfFaAzZyY])(\d+)$/

// Matches SPICE's "meg" mega suffix with no fractional part, e.g. "1meg".
// `format-si-unit` does not understand "meg", so rewrite it to "M".
const SPICE_MEGA_PATTERN = /^(\d+(?:\.\d+)?)meg$/i

/**
 * If `value` is a string in RKM notation, return an equivalent string with an
 * explicit decimal point (e.g. "4k7" -> "4.7k"). SPICE "meg" values are
 * rewritten to "M" (e.g. "1meg" -> "1M"). Otherwise return `value` unchanged.
 *
 * Uppercase `U` and `N` are not SI prefixes (the SI symbols are `u` = micro and
 * `n` = nano), so they are lowercased when they appear as the RKM separator,
 * e.g. "2U2" -> "2.2u", "4N7" -> "4.7n". `P` is ambiguous: it is peta in SI but
 * pico in the capacitor-marking convention, so it is only lowercased to `p`
 * when `options.capacitive` is set (callers pass this for capacitance and
 * inductance). `K`/`M`/`G` are already valid SI symbols and are preserved.
 */
export const normalizeRkmNotation = (
  value: unknown,
  options?: { capacitive?: boolean },
): unknown => {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  const match = RKM_PATTERN.exec(trimmed)
  if (match) {
    const [, intPart, rawPrefix, fracPart] = match
    let prefix = rawPrefix
    // Uppercase U (micro) and N (nano) are not SI symbols; normalize to lower.
    if (prefix === "U") prefix = "u"
    else if (prefix === "N") prefix = "n"
    // P is peta in SI but pico in capacitor marking; only treat as pico when
    // the caller signals a capacitive/inductive context.
    else if (prefix === "P" && options?.capacitive) prefix = "p"
    return `${intPart}.${fracPart}${prefix}`
  }
  const spiceMatch = SPICE_MEGA_PATTERN.exec(trimmed)
  if (spiceMatch) {
    return `${spiceMatch[1]}M`
  }
  return value
}

// Props that carry SI-unit values parsed by circuit-json's
// `parseAndConvertSiUnit` (resistance, capacitance, inductance, voltage,
// current, etc.). RKM notation is only meaningful for these; other string
// props (names, selectors, footprints) must be left untouched.
const SI_UNIT_PROP_KEYS = new Set([
  "resistance",
  "capacitance",
  "inductance",
  "voltage",
  "current",
  "maxVoltageRating",
  "maxCurrentRating",
  "maxResistance",
  "maxCapacitance",
  "maxInductance",
  "minVoltageRating",
  "ratedVoltage",
  "ratedCurrent",
  "breakdownVoltage",
  "impedance",
])

// Props where an uppercase "P" RKM separator should be read as pico (the
// capacitor/inductor marking convention) rather than peta (the SI meaning).
// `P` is only lowercased to `p` for these props; for resistance/voltage/etc.
// it is left untouched to avoid silently reinterpreting peta as pico.
const CAPACITIVE_PROPS = new Set([
  "capacitance",
  "inductance",
  "maxCapacitance",
  "maxInductance",
])

/**
 * Return a shallow copy of `props` with RKM-notation values for known
 * SI-unit props normalized to decimal form. Non-string values and unknown
 * props are passed through unchanged.
 */
export const normalizeRkmNotationInProps = <T extends Record<string, unknown>>(
  props: T,
): T => {
  let changed = false
  const next: Record<string, unknown> = { ...props }
  for (const key of Object.keys(props)) {
    if (!SI_UNIT_PROP_KEYS.has(key)) continue
    const normalized = normalizeRkmNotation(props[key], {
      capacitive: CAPACITIVE_PROPS.has(key),
    })
    if (normalized !== props[key]) {
      next[key] = normalized
      changed = true
    }
  }
  return changed ? (next as T) : props
}
