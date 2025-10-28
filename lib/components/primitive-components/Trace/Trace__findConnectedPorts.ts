import type { Port } from "../Port/Port"
import type { Trace } from "./Trace"
import { TraceConnectionError } from "../../../errors"

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

  const portsWithSelectors = portSelectors.map((selector) => ({
    selector,
    port:
      (trace.getSubcircuit().selectOne(selector, { type: "port" }) as Port) ??
      null,
  }))

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

  const ports = portsWithSelectors.map(({ port }) => port!)

  for (const port of ports) {
    port._addConnectedTrace(trace)
  }

  return {
    allPortsFound: true,
    portsWithSelectors,
    ports: ports,
  }
}
