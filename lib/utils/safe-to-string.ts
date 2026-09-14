/**
 * Convert an arbitrary value to a string without ever throwing.
 *
 * Plain string interpolation throws "Cannot convert object to primitive value"
 * for values that have no default primitive conversion, such as a
 * null-prototype object or a proxy that traps property access. Unvalidated
 * props can hold such values, so any code that builds a label from them must
 * coerce through this helper.
 */
export const safeToString = (value: unknown): string => {
  try {
    return String(value)
  } catch {
    try {
      return Object.prototype.toString.call(value)
    } catch {
      return "[unprintable]"
    }
  }
}
