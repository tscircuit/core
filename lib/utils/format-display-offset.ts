/**
 * Formats a pcb offset for `display_offset_x/y`, which circuit-json
 * types as strings "corresponding with how the user specified it".
 * Numbers are resolved millimeter values.
 */
export const formatDisplayOffset = (
  offset: string | number | undefined,
): string | undefined =>
  offset === undefined
    ? undefined
    : typeof offset === "string"
      ? offset
      : `${offset}mm`
