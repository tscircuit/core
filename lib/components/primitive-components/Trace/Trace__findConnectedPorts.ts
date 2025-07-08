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
  const { db } = trace.root!
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
        if (parentSelector) {
          trace.renderError(
            `Could not find port for selector "${selector}". Component "${parentSelector}" not found`,
          )
        } else {
          trace.renderError(`Could not find port for selector "${selector}"`)
        }
      } else {
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
        trace.renderError(
          `Could not find port for selector "${selector}". Component "${targetComponent.props.name ?? parentSelector}" found, but does not have pin "${portLabel}". ${detail}`,
        )
      }
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
