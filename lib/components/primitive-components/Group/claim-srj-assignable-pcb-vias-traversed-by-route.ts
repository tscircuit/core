import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbTrace } from "circuit-json"
import type { CircuitJsonMetadata } from "lib/utils/autorouting/SimpleRouteJson"

type RoutePointWithSrjMetadata = {
  route_type: string
  circuitJsonMetadata?: CircuitJsonMetadata
}

export const claimSrjAssignablePcbViasTraversedByRoute = ({
  db,
  pcbTrace,
  routeWithSrjMetadata,
}: {
  db: CircuitJsonUtilObjects
  pcbTrace: PcbTrace
  routeWithSrjMetadata: RoutePointWithSrjMetadata[]
}) => {
  for (const routePoint of routeWithSrjMetadata) {
    if (routePoint.route_type !== "through_pad") continue

    const pcbViaId = routePoint.circuitJsonMetadata?.pcb_via_id
    if (!pcbViaId) continue

    const assignablePcbVia = db.pcb_via.get(pcbViaId)
    if (
      !assignablePcbVia?.net_is_assignable ||
      (assignablePcbVia.net_assigned &&
        assignablePcbVia.pcb_trace_id !== pcbTrace.pcb_trace_id)
    ) {
      continue
    }

    db.pcb_via.update(assignablePcbVia.pcb_via_id, {
      pcb_trace_id: pcbTrace.pcb_trace_id,
      net_assigned: true,
    })
  }
}
