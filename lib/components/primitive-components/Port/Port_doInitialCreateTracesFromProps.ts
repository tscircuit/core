import { Trace } from "../Trace/Trace"
import type { Port } from "./Port"

const getConnectionTargets = (
  target: string | string[] | readonly string[] | undefined,
): string[] => {
  if (!target) return []
  return typeof target === "string" ? [target] : [...target]
}

export function Port_doInitialCreateTracesFromProps(port: Port): void {
  if (!port.isGroupPort()) return

  const connectsTo = port._parsedProps.connectsTo
  if (!connectsTo) return

  const parent = port.parent
  if (!parent) return

  const parentConnections = parent._parsedProps?.connections as
    | Record<string, string | string[] | readonly string[] | undefined>
    | undefined

  const connectionIsCreatedByParent = Object.keys(parentConnections ?? {}).some(
    (pinName) => port.isMatchingAnyOf([pinName]),
  )
  if (connectionIsCreatedByParent) return

  const portName = port.name
  if (!portName) return

  const from = parent.name
    ? `.${parent.name} > .${portName}`
    : `${parent.getSubcircuitSelector()} > port.${portName}`
  for (const target of getConnectionTargets(connectsTo)) {
    const traceAlreadyExists = parent.children.some((child) => {
      if (!(child instanceof Trace)) return false
      const traceProps = child._parsedProps
      if (!("from" in traceProps) || !("to" in traceProps)) return false
      return (
        (traceProps.from === from && traceProps.to === target) ||
        (traceProps.from === target && traceProps.to === from)
      )
    })
    if (traceAlreadyExists) continue

    parent.add(
      new Trace({
        from,
        to: target,
        displayName: parent._parsedProps.showAsSchematicBox
          ? undefined
          : portName,
      }),
    )
  }
}
