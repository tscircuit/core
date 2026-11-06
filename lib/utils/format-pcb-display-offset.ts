/** Format an authored PCB-local axis offset for display. Numeric offsets are
 * distances in mm; preserve string expressions instead of evaluating them. */
export function formatPcbDisplayOffset(offset: number | string | undefined) {
  return typeof offset === "number" ? `${offset}mm` : offset
}
