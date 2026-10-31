import type { SubcircuitGroupProps } from "@tscircuit/props"
import type { Group } from "./Group"

/**
 * Trace widths (mm) the autorouter uses for connections in this subcircuit
 * that do not specify their own width.
 *
 * A nominal width below an explicit `minTraceWidth` is raised to that minimum,
 * so autorouted traces never violate the subcircuit's own design rule.
 * `requestedNominalTraceWidth` keeps the width as written so callers can
 * report the change.
 */
export const Group_getAutoroutingTraceWidths = (group: Group<any>) => {
  const props = group._parsedProps as SubcircuitGroupProps
  const minTraceWidth = Number(props.minTraceWidth ?? 0.15)
  const nominalTraceWidthPropertyName =
    props.defaultTraceWidth !== undefined
      ? "defaultTraceWidth"
      : "nominalTraceWidth"
  const requestedNominalTraceWidthProp =
    props.defaultTraceWidth ?? props.nominalTraceWidth
  const requestedNominalTraceWidth =
    requestedNominalTraceWidthProp !== undefined
      ? Number(requestedNominalTraceWidthProp)
      : undefined
  const isNominalTraceWidthRaisedToMin =
    props.minTraceWidth !== undefined &&
    requestedNominalTraceWidth !== undefined &&
    requestedNominalTraceWidth < minTraceWidth

  return {
    minTraceWidth,
    nominalTraceWidth: isNominalTraceWidthRaisedToMin
      ? minTraceWidth
      : requestedNominalTraceWidth,
    nominalTraceWidthPropertyName,
    requestedNominalTraceWidth,
    isNominalTraceWidthRaisedToMin,
  }
}
