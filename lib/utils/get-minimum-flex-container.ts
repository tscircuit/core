export type FlexDirection = "row" | "column"

export interface FlexItemSize {
  /** Width of the item (in the same units as returned width of container) */
  width: number
  /** Height of the item */
  height: number
  /** Optional margin values – default to 0 */
  marginLeft?: number
  marginRight?: number
  marginTop?: number
  marginBottom?: number
}

export interface MinimumFlexContainer {
  /** Calculated container width */
  width: number
  /** Calculated container height */
  height: number
}

/**
 * Compute the smallest possible flex-box-style container that can fit the
 * provided items.
 *
 * The calculation is intentionally **simple** – it supports only single-line
 * flex layouts (no wrapping) but correctly handles the primary concepts that
 * matter for PCB placement today:
 *
 *   • `direction` – "row" (default) or "column"
 *   • `gap` – uniform space inserted between adjacent items
 *   • individual `margin*` values on items
 *
 * When the direction is "row" the container width is the sum of the item
 * widths + margins + inter-item gaps while the height is the maximum item
 * height + vertical margins. For the "column" direction the calculation is
 * performed the other way around.
 *
 * All distance values are expected to be in the same unit (typically **mm**)
 * and **no unit conversion** is performed inside the function.
 */
export function getMinimumFlexContainer(
  items: FlexItemSize[],
  opts: {
    direction?: FlexDirection
    gap?: number
  } = {},
): MinimumFlexContainer {
  const direction: FlexDirection = opts.direction ?? "row"
  const gap = opts.gap ?? 0

  if (items.length === 0) {
    return { width: 0, height: 0 }
  }

  if (direction === "row") {
    let totalWidth = 0
    let maxHeight = 0

    items.forEach((item, idx) => {
      const marginLeft = item.marginLeft ?? 0
      const marginRight = item.marginRight ?? 0
      const marginTop = item.marginTop ?? 0
      const marginBottom = item.marginBottom ?? 0

      // Width accumulates item width, horizontal margins, and gap (except after last item)
      totalWidth += marginLeft + item.width + marginRight
      if (idx < items.length - 1) {
        totalWidth += gap
      }

      // Track tallest (including vertical margins)
      const itemHeightWithMargin = marginTop + item.height + marginBottom
      if (itemHeightWithMargin > maxHeight) {
        maxHeight = itemHeightWithMargin
      }
    })

    return { width: totalWidth, height: maxHeight }
  } else {
    // column direction
    let totalHeight = 0
    let maxWidth = 0

    items.forEach((item, idx) => {
      const marginLeft = item.marginLeft ?? 0
      const marginRight = item.marginRight ?? 0
      const marginTop = item.marginTop ?? 0
      const marginBottom = item.marginBottom ?? 0

      // Height accumulates item height, vertical margins, and gap (except after last item)
      totalHeight += marginTop + item.height + marginBottom
      if (idx < items.length - 1) {
        totalHeight += gap
      }

      // Track widest (including horizontal margins)
      const itemWidthWithMargin = marginLeft + item.width + marginRight
      if (itemWidthWithMargin > maxWidth) {
        maxWidth = itemWidthWithMargin
      }
    })

    return { width: maxWidth, height: totalHeight }
  }
}