import type { PcbPort, SourcePort, SourceTrace } from "circuit-json"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

type SourcePortId = SourcePort["source_port_id"]
type PcbEndpoint = Pick<PcbPort, "pcb_port_id" | "source_port_id" | "x" | "y">

export type StraightLineTraceLengthViolation = {
  sourceTraceId: SourceTrace["source_trace_id"]
  traceDisplayName?: string
  straightLineDistance: number
  maximumTraceLength: number
}

const TRACE_LENGTH_COMPARISON_TOLERANCE_MM = 1e-6

const getGreatestEndpointDistance = (pcbEndpoints: PcbEndpoint[]) => {
  let greatestEndpointDistance = 0

  for (
    let firstEndpointIndex = 0;
    firstEndpointIndex < pcbEndpoints.length;
    firstEndpointIndex++
  ) {
    const firstEndpoint = pcbEndpoints[firstEndpointIndex]
    for (
      let secondEndpointIndex = firstEndpointIndex + 1;
      secondEndpointIndex < pcbEndpoints.length;
      secondEndpointIndex++
    ) {
      const secondEndpoint = pcbEndpoints[secondEndpointIndex]
      greatestEndpointDistance = Math.max(
        greatestEndpointDistance,
        Math.hypot(
          secondEndpoint.x - firstEndpoint.x,
          secondEndpoint.y - firstEndpoint.y,
        ),
      )
    }
  }

  return greatestEndpointDistance
}

const getClosestEndpointDistance = (
  sourcePcbEndpoints: PcbEndpoint[],
  targetPcbEndpoints: PcbEndpoint[],
) => {
  let closestEndpointDistance = Number.POSITIVE_INFINITY

  for (const sourcePcbEndpoint of sourcePcbEndpoints) {
    for (const targetPcbEndpoint of targetPcbEndpoints) {
      closestEndpointDistance = Math.min(
        closestEndpointDistance,
        Math.hypot(
          targetPcbEndpoint.x - sourcePcbEndpoint.x,
          targetPcbEndpoint.y - sourcePcbEndpoint.y,
        ),
      )
    }
  }

  return closestEndpointDistance
}

export const getStraightLineTraceLengthViolations = ({
  component,
  subcircuit,
}: {
  component: PrimitiveComponent
  subcircuit: { subcircuit_id: string | null }
}): StraightLineTraceLengthViolation[] => {
  const { db } = component.root!
  const subcircuitSourceTraces = db.source_trace
    .list()
    .filter(
      (sourceTrace) => sourceTrace.subcircuit_id === subcircuit.subcircuit_id,
    )
  const sourceConnectivityMap = new ConnectivityMap({})
  sourceConnectivityMap.addConnections(
    subcircuitSourceTraces.map((sourceTrace) => [
      sourceTrace.source_trace_id,
      ...sourceTrace.connected_source_port_ids,
      ...sourceTrace.connected_source_net_ids,
    ]),
  )
  const pcbPortsBySourcePortId = new Map<SourcePortId, PcbEndpoint>()
  for (const pcbPort of db.pcb_port.list()) {
    if (
      typeof pcbPort.source_port_id !== "string" ||
      typeof pcbPort.x !== "number" ||
      typeof pcbPort.y !== "number"
    )
      continue

    pcbPortsBySourcePortId.set(pcbPort.source_port_id, {
      pcb_port_id: pcbPort.pcb_port_id,
      source_port_id: pcbPort.source_port_id,
      x: pcbPort.x,
      y: pcbPort.y,
    })
  }
  const violations: StraightLineTraceLengthViolation[] = []

  for (const sourceTrace of subcircuitSourceTraces) {
    if (typeof sourceTrace.max_length !== "number") continue

    const pcbEndpoints = sourceTrace.connected_source_port_ids
      .map((sourcePortId) => pcbPortsBySourcePortId.get(sourcePortId))
      .filter((pcbPort): pcbPort is PcbEndpoint => Boolean(pcbPort))

    let straightLineDistance: number
    if (pcbEndpoints.length >= 2) {
      straightLineDistance = getGreatestEndpointDistance(pcbEndpoints)
    } else {
      if (
        pcbEndpoints.length !== 1 ||
        sourceTrace.connected_source_net_ids.length === 0
      )
        continue

      const sourceNetworkId = sourceConnectivityMap.getNetConnectedToId(
        sourceTrace.source_trace_id,
      )
      if (!sourceNetworkId) continue

      const sourcePortIdsOnNetwork = sourceConnectivityMap
        .getIdsConnectedToNet(sourceNetworkId)
        .filter(
          (connectedId) =>
            !sourceTrace.connected_source_port_ids.includes(connectedId) &&
            pcbPortsBySourcePortId.has(connectedId),
        )
      const targetPcbEndpoints = sourcePortIdsOnNetwork
        .map((sourcePortId) => pcbPortsBySourcePortId.get(sourcePortId))
        .filter((pcbPort): pcbPort is PcbEndpoint => Boolean(pcbPort))
      if (targetPcbEndpoints.length === 0) continue

      const networkHasPlane = db
        .toArray()
        .some(
          (element) =>
            (element.type === "source_pcb_ground_plane" ||
              element.type === "pcb_ground_plane" ||
              element.type === "pcb_copper_pour") &&
            typeof element.source_net_id === "string" &&
            sourceConnectivityMap.areIdsConnected(
              sourceTrace.source_trace_id,
              element.source_net_id,
            ),
        )
      if (networkHasPlane) continue

      straightLineDistance = getClosestEndpointDistance(
        pcbEndpoints,
        targetPcbEndpoints,
      )
    }

    if (
      straightLineDistance <=
      sourceTrace.max_length + TRACE_LENGTH_COMPARISON_TOLERANCE_MM
    )
      continue

    violations.push({
      sourceTraceId: sourceTrace.source_trace_id,
      traceDisplayName: sourceTrace.display_name,
      straightLineDistance,
      maximumTraceLength: sourceTrace.max_length,
    })
  }

  return violations
}

export const shouldSkipAutoroutingBecauseOfTraceLengthViolations = ({
  component,
  subcircuit,
}: {
  component: PrimitiveComponent
  subcircuit: { subcircuit_id: string | null }
}): boolean => {
  const violations = getStraightLineTraceLengthViolations({
    component,
    subcircuit,
  })
  if (violations.length === 0) return false

  const { db } = component.root!
  const pcbErrorId = `pcb_autorouting_skipped_trace_length_violations_${subcircuit.subcircuit_id}`
  const errorAlreadyExists = db.pcb_autorouting_error
    .list()
    .some((error) => error.pcb_error_id === pcbErrorId)

  if (!errorAlreadyExists) {
    const violationClauses = violations.map((violation) => {
      const traceName = violation.traceDisplayName ?? violation.sourceTraceId
      return `${traceName}: its endpoints are ${violation.straightLineDistance.toFixed(2)}mm apart but its max_length is ${violation.maximumTraceLength}mm`
    })
    const summary =
      violations.length === 1
        ? "a trace max_length constraint cannot be satisfied"
        : `${violations.length} trace max_length constraints cannot be satisfied`

    db.pcb_autorouting_error.insert({
      pcb_error_id: pcbErrorId,
      error_type: "pcb_autorouting_error",
      subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      message: `Autorouting was skipped because ${summary}. Increase the max_length or move the connected pads closer. Affected trace${violations.length === 1 ? "" : "s"}: ${violationClauses.join("; ")}.`,
    })
  }

  return true
}
