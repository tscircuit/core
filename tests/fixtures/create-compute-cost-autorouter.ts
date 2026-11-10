import type { AutorouterComputeCost } from "lib/events"
import type { GenericLocalAutorouter } from "lib/utils/autorouting/GenericLocalAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "./createBasicAutorouter"

export const computeCost: AutorouterComputeCost = {
  metric: "solo_search_iterations",
  totalIterations: 40,
  measuredPairCount: 1,
  pairs: [
    {
      connectionName: "R2_connection",
      rootConnectionNames: ["source_trace_0", "source_trace_1"],
      pcbPortIds: ["pcb_port_0", null],
      iterations: 40,
      share: 1,
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
      getComputeCost: () => computeCost,
      on(event: "complete" | "error" | "progress", callback: any) {
        if (event === "progress") {
          on(event, (progress) => {
            if (emitProgress) callback({ ...progress, computeCost })
          })
        } else if (event === "complete") {
          on(event, callback)
        } else {
          on(event, callback)
        }
      },
    }
  }
