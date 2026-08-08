import type { Breakout } from "./Breakout"

const PADDING_PROP_NAMES = [
  "padding",
  "paddingX",
  "paddingY",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "paddingBottom",
] as const

/**
 * `<breakout padding>` pads the group's layout; it does not move the boundary
 * the fanout escapes to. That only follows `fanoutBoundaryPadding`, so a
 * breakout that sets padding alone silently gets the tight bounding box of its
 * contents -- which reads as "I gave the fanout room and it still failed".
 *
 * Warn instead of quietly honouring `padding` as the fanout boundary: a wider
 * boundary changes routing outcomes, so reinterpreting it would alter existing
 * boards rather than just informing them.
 */
export const Breakout_warnAboutIgnoredPadding = (breakout: Breakout) => {
  const { db } = breakout.root!
  const props = breakout._parsedProps as Record<string, unknown>

  if (props.fanoutBoundaryPadding !== undefined) return
  // Explicit geometry already pins the boundary, so padding is not the knob
  // the user is reaching for.
  if (
    props.width !== undefined ||
    props.height !== undefined ||
    (Array.isArray(props.outline) && props.outline.length > 0)
  ) {
    return
  }

  const setPaddingProps = PADDING_PROP_NAMES.filter(
    (propName) => props[propName] !== undefined,
  )
  if (setPaddingProps.length === 0) return

  db.source_property_ignored_warning.insert({
    source_component_id: breakout.source_component_id ?? "",
    property_name: setPaddingProps[0]!,
    subcircuit_id: breakout.getSubcircuit().subcircuit_id ?? undefined,
    error_type: "source_property_ignored_warning",
    message:
      `Breakout ${breakout.name} sets ${setPaddingProps.map((propName) => `"${propName}"`).join(", ")} but no "fanoutBoundaryPadding", ` +
      "so the fanout still escapes to the tight bounding box of the breakout's contents. " +
      'Padding props only pad the group\'s layout. Set "fanoutBoundaryPadding" to give the fanout room to escape into.',
  })
}
