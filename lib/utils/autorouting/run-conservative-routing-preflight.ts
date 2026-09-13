import { PreflightRoutingSolver } from "@tscircuit/preflight-routing-solver"
import type { SimpleRouteJson as AutorouterSimpleRouteJson } from "@tscircuit/capacity-autorouter"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { SimpleRouteJson } from "./SimpleRouteJson"
import { insertPcbPreflightRoutingError } from "./insert-pcb-preflight-routing-error"

/** SRJ points use board world coordinates in mm: +X right, +Y up; layers are physical copper layers. */
export async function runConservativeRoutingPreflight({
  component,
  simpleRouteJson,
  subcircuitId,
  routingPhaseIndex,
  phaseName,
}: {
  component: PrimitiveComponent
  simpleRouteJson: SimpleRouteJson
  subcircuitId: string | null
  routingPhaseIndex?: number
  phaseName?: string
}): Promise<boolean> {
  const startedAt = performance.now()
  const solver = new PreflightRoutingSolver(
    simpleRouteJson as AutorouterSimpleRouteJson,
  )
  let lastYieldAt = startedAt
  try {
    while (
      !solver.solved &&
      !solver.failed &&
      performance.now() - startedAt < 100
    ) {
      solver.step()
      if (performance.now() - lastYieldAt >= 4) {
        await new Promise((resolve) => setTimeout(resolve, 0))
        lastYieldAt = performance.now()
      }
    }
    if (solver.failed)
      throw new Error(solver.error ?? "Preflight solver failed")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    insertPcbPreflightRoutingError(component, {
      error_code: "preflight_check_failed",
      message,
      subcircuit_id: subcircuitId ?? undefined,
      routing_phase_index: routingPhaseIndex,
      phase_name: phaseName,
    })
    component.root?.emit("autorouting:preflight", {
      type: "autorouting:preflight",
      subcircuit_id: subcircuitId,
      componentDisplayName: component.getString(),
      routingPhaseIndex,
      phaseName,
      status: "failed",
      elapsedMs: performance.now() - startedAt,
    })
    return true
  }
  const result = solver.getOutput()
  component.root?.emit("autorouting:preflight", {
    type: "autorouting:preflight",
    subcircuit_id: subcircuitId,
    componentDisplayName: component.getString(),
    routingPhaseIndex,
    phaseName,
    status: solver.solved ? "completed" : "budget_exhausted",
    result,
    elapsedMs: performance.now() - startedAt,
  })
  for (const diagnostic of result.diagnostics) {
    const connection = simpleRouteJson.connections.find(
      (connection) => connection.name === diagnostic.connectionName,
    )
    insertPcbPreflightRoutingError(component, {
      error_code: diagnostic.code,
      message: diagnostic.message,
      subcircuit_id: subcircuitId ?? undefined,
      routing_phase_index: routingPhaseIndex,
      phase_name: phaseName,
      pcb_port_ids: diagnostic.pcbPortIds,
      source_trace_ids: connection?.source_trace_id
        ? [connection.source_trace_id]
        : undefined,
      measurements: result.measurements,
    })
  }
  return result.diagnostics.length > 0
}
