import type { AutorouterComputeCostSummary } from "lib/events"
import type { GenericLocalAutorouter } from "lib/utils/autorouting/GenericLocalAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "./createBasicAutorouter"

export const computeCostSummary: AutorouterComputeCostSummary = {
  metric: "hypergraph_route_search_iterations",
  measuredPairCount: 1,
  topPairs: [
    {
      connectionName: "R2_connection",
      rootConnectionNames: ["source_trace_0", "source_trace_1"],
      pcbPortIds: ["pcb_port_0", null],
      iterations: 40,
    },
  ],
}

export const createComputeCostAutorouter =
  ({ fail = false, emitProgress = true } = {}) =>
  async (input: SimpleRouteJson): Promise<GenericLocalAutorouter> => {
    const autorouter = await createBasicAutorouter(async () => {
      if (fail) throw new Error("test routing failure")
      return []
    })(input)
    const on = autorouter.on.bind(autorouter)
    return {
      ...autorouter,
      getComputeCostSummary: () => computeCostSummary,
      on(event: "complete" | "error" | "progress", callback: any) {
        if (event === "progress") {
          on(event, (progress) => {
            if (emitProgress) callback({ ...progress, computeCostSummary })
          })
        } else if (event === "complete") {
          on(event, callback)
        } else {
          on(event, callback)
        }
      },
    }
  }
