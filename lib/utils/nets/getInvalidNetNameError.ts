/**
 * Returns a human-readable error message if the given selector references an
 * invalid net name (e.g. one containing a period, a "+"/"-", or starting with a
 * digit), or null if the net name is valid.
 *
 * This is the single source of truth for net-name validation so that both the
 * selector preprocessor and net creation report identical messages.
 *
 * `getComponentName` is a lazy getter (only invoked for the "+"/"-" case) so
 * that callers don't eagerly evaluate a potentially expensive `componentName`
 * getter for every selector they process.
 */
export const getInvalidNetNameError = (
  selector: string,
  getComponentName?: () => string | undefined,
): string | null => {
  // Fast path: only net selectors can have invalid net names.
  if (!selector.includes("net.")) return null

  if (/net\.[^\s>]*\./.test(selector)) {
    return 'Net names cannot contain a period, try using "sel.net..." to autocomplete with conventional net names, e.g. V3_3'
  }
  if (/net\.[^\s>]*[+-]/.test(selector)) {
    const netName = selector.split("net.")[1]?.split(/[ >]/)[0] ?? selector
    const componentName = getComponentName?.() ?? "Unknown component"
    return (
      `Net names cannot contain "+" or "-" (component "${componentName}" received "${netName}" via "${selector}"). ` +
      `Try using underscores instead, e.g. VCC_P`
    )
  }
  if (/net\.[0-9]/.test(selector)) {
    const match = selector.match(/net\.([^ >]+)/)
    const netName = match ? match[1] : ""
    return `Net name "${netName}" cannot start with a number, try using a prefix like "VBUS1"`
  }
  return null
}
