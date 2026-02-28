import { TraceConnectionError } from "../../../errors"
import type { Port } from "../Port/Port"
import type { Trace } from "./Trace"

export function Trace__findConnectedPorts(trace: Trace):
  | {
      allPortsFound: true
      ports: Port[]
      portsWithSelectors: Array<{ selector: string; port: Port }>
    }
  | {
      allPortsFound: false
      ports?: undefined
      portsWithSelectors?: undefined
    } {
  const { _parsedProps: props, parent } = trace

  if (!parent) throw new Error("Trace has no parent")

  const portSelectors = trace.getTracePortPathSelectors()

  const portsWithSelectors = portSelectors.map((selector) => {
    let port =
      (trace.getSubcircuit().selectOne(selector, { type: "port" }) as Port) ??
      null

    // If no port found and selector has no pin suffix (bare component name),
    // default to pin1. A dot at the start of the tail is a CSS class selector
    // (e.g. ".R1"), not a pin separator (e.g. "R1.pin1").
    if (!port) {
      const lastSpace = selector.lastIndexOf(" ")
      const tail = lastSpace === -1 ? selector : selector.slice(lastSpace + 1)
      const pinDotIndex = tail.indexOf(".", 1) // skip leading dot if present (CSS class)
      if (pinDotIndex === -1) {
        port =
          (trace
            .getSubcircuit()
            .selectOne(`${selector}.pin1`, { type: "port" }) as Port) ?? null
      }
    }

    return { selector, port }
  })

  for (const { selector, port } of portsWithSelectors) {
    if (!port) {
      let parentSelector: string
      let portToken: string
      const dotIndex = selector.lastIndexOf(".")
      if (dotIndex !== -1 && dotIndex > selector.lastIndexOf(" ")) {
        parentSelector = selector.slice(0, dotIndex)
        portToken = selector.slice(dotIndex + 1)
      } else {
        const match = selector.match(/^(.*[ >])?([^ >]+)$/)
        parentSelector = match?.[1]?.trim() ?? ""
        portToken = match?.[2] ?? selector
      }
      let targetComponent = parentSelector
        ? trace.getSubcircuit().selectOne(parentSelector)
        : null
      if (
        !targetComponent &&
        parentSelector &&
        !/[.#\[]/.test(parentSelector)
      ) {
        targetComponent = trace.getSubcircuit().selectOne(`.${parentSelector}`)
      }
      if (!targetComponent) {
        const errorMessage = parentSelector
          ? `Could not find port for selector "${selector}". Component "${parentSelector}" not found`
          : `Could not find port for selector "${selector}"`

        const subcircuit = trace.getSubcircuit()
        const sourceGroup = subcircuit.getGroup()
        throw new TraceConnectionError({
          error_type: "source_trace_not_connected_error",
          message: errorMessage,
          subcircuit_id: subcircuit.subcircuit_id ?? undefined,
          source_group_id: sourceGroup?.source_group_id ?? undefined,
          source_trace_id: trace.source_trace_id ?? undefined,
          selectors_not_found: [selector],
        })
      }

      const ports = targetComponent.children.filter(
        (c) => c.componentName === "Port",
      ) as Port[]
      const portLabel = portToken.includes(".")
        ? (portToken.split(".").pop() ?? "")
        : portToken
      const portNames = ports.flatMap((c) => c.getNameAndAliases())
      const hasCustomLabels = portNames.some((n) => !/^(pin\d+|\d+)$/.test(n))
      const labelList = Array.from(new Set(portNames)).join(", ")
      let detail: string
      if (ports.length === 0) {
        detail = "It has no ports"
      } else if (!hasCustomLabels) {
        detail = `It has ${ports.length} pins and no pinLabels (consider adding pinLabels)`
      } else {
        detail = `It has [${labelList}]`
      }

      const errorMessage = `Could not find port for selector "${selector}". Component "${targetComponent.props.name ?? parentSelector}" found, but does not have pin "${portLabel}". ${detail}`

      const subcircuit = trace.getSubcircuit()
      const sourceGroup = subcircuit.getGroup()
      throw new TraceConnectionError({
        error_type: "source_trace_not_connected_error",
        message: errorMessage,
        subcircuit_id: subcircuit.subcircuit_id ?? undefined,
        source_group_id: sourceGroup?.source_group_id ?? undefined,
        source_trace_id: trace.source_trace_id ?? undefined,
        selectors_not_found: [selector],
      })
    }
  }

  if (portsWithSelectors.some((p) => !p.port)) {
    return { allPortsFound: false }
  }

  return {
    allPortsFound: true,
    portsWithSelectors,
    ports: portsWithSelectors.map(({ port }) => port),
  }
}
