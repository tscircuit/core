import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import type { Trace } from "./Trace"
import { isPowerOrGroundNetLabel } from "lib/utils/schematic/isPowerOrGroundNetLabel"

export function Trace__doInitialSchematicTraceRenderWithDisplayLabel(
  trace: Trace,
): void {
  if (trace.root?.schematicDisabled) return
  const { db } = trace.root!
  const { _parsedProps: props, parent } = trace

  if (!parent) throw new Error("Trace has no parent")

  const { allPortsFound, portsWithSelectors: connectedPorts } =
    trace._findConnectedPorts()

  if (!allPortsFound) return

  const portsWithPosition = connectedPorts.map(({ port }) => ({
    port,
    position: port._getGlobalSchematicPositionAfterLayout(),
    schematic_port_id: port.schematic_port_id!,
    facingDirection: port.facingDirection,
  }))
  if (portsWithPosition.length < 2) {
    throw new Error("Expected at least two ports in portsWithPosition.")
  }

  let fromPortName: any
  let toPortName: any
  const fromAnchorPos = portsWithPosition[0].position
  const fromPort = portsWithPosition[0].port

  // Validate `path`, `from`, and `to`
  if ("path" in trace.props) {
    if (trace.props.path.length !== 2) {
      throw new Error("Invalid 'path': Must contain exactly two elements.")
    }
    ;[fromPortName, toPortName] = trace.props.path
  } else {
    if (!("from" in trace.props && "to" in trace.props)) {
      throw new Error("Missing 'from' or 'to' properties in props.")
    }
    fromPortName = trace.props.from
    toPortName = trace.props.to
  }

  if (!fromPort.source_port_id) {
    throw new Error(
      `Missing source_port_id for the 'from' port (${fromPortName}).`,
    )
  }
  const toAnchorPos = portsWithPosition[1].position
  const toPort = portsWithPosition[1].port

  if (!toPort.source_port_id) {
    throw new Error(`Missing source_port_id for the 'to' port (${toPortName}).`)
  }

  // Handle `from` port label
  const existingFromNetLabel = db.schematic_net_label
    .list()
    .find((label) => label.source_net_id === fromPort.source_port_id)

  const existingToNetLabel = db.schematic_net_label
    .list()
    .find((label) => label.source_net_id === toPort.source_port_id)

  const [firstPort, secondPort] = connectedPorts.map(({ port }) => port)
  const isFirstPortSchematicBox =
    firstPort.parent?.config.shouldRenderAsSchematicBox
  const pinFullName = isFirstPortSchematicBox
    ? `${firstPort?.parent?.props.name}_${firstPort?.props.name}`
    : `${secondPort?.parent?.props.name}_${secondPort?.props.name}`

  const netLabelText = trace.props.schDisplayLabel ?? pinFullName

  if (existingFromNetLabel && existingFromNetLabel.text !== netLabelText) {
    existingFromNetLabel.text = `${netLabelText} / ${existingFromNetLabel.text}`
  }

  if (existingToNetLabel && existingToNetLabel?.text !== netLabelText) {
    existingToNetLabel.text = `${netLabelText} / ${existingToNetLabel.text}`
  }

  if (!existingToNetLabel) {
    let toSide =
      getEnteringEdgeFromDirection(toPort.facingDirection!) ?? "bottom"
    // Prefer horizontal orientation for non-power labels
    const toText = trace.props.schDisplayLabel! ?? pinFullName
    const isPowerOrGroundNetTo = isPowerOrGroundNetLabel(toText)
    if (!isPowerOrGroundNetTo && (toSide === "top" || toSide === "bottom")) {
      toSide = "right"
    }
    db.schematic_net_label.insert({
      text: toText,
      source_net_id: toPort.source_port_id!,
      anchor_position: toAnchorPos,
      center: computeSchematicNetLabelCenter({
        anchor_position: toAnchorPos,
        anchor_side: toSide,
        text: toText,
      }),
      anchor_side: toSide,
    })
  }
  if (!existingFromNetLabel) {
    let fromSide =
      getEnteringEdgeFromDirection(fromPort.facingDirection!) ?? "bottom"
    // Prefer horizontal orientation for non-power labels
    const fromText = trace.props.schDisplayLabel! ?? pinFullName
    const isPowerOrGroundNetFrom = isPowerOrGroundNetLabel(fromText)
    if (
      !isPowerOrGroundNetFrom &&
      (fromSide === "top" || fromSide === "bottom")
    ) {
      fromSide = "right"
    }
    db.schematic_net_label.insert({
      text: fromText,
      source_net_id: fromPort.source_port_id!,
      anchor_position: fromAnchorPos,
      center: computeSchematicNetLabelCenter({
        anchor_position: fromAnchorPos,
        anchor_side: fromSide,
        text: fromText,
      }),
      anchor_side: fromSide,
    })
  }
}
