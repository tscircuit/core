/**
 * Normalize a net selector so the different net-selector helpers agree on its
 * form. Users sometimes write a net selector with a leading dot (".net.VBUS")
 * as if it were a class selector. Strip that dot so the selector matches the
 * canonical "net.VBUS" form.
 */
export const normalizeNetSelector = (selector: string): string =>
  selector.startsWith(".net.") ? selector.slice(1) : selector
