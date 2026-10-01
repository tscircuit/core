import { expect, test } from "bun:test"
import { BusLanesAutorouter } from "lib/utils/autorouting/BusLanesAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import input from "./fixtures/am3352-cm5-horizontal.srj.json"

// Reduced to two packages and the 47 DDR signals. Original pad endpoints in
// board-world mm (+X right, +Y up) require native automatic local dogbones.
// Published core 0.0.2031 / bus-lanes-solver 0.0.5 exhausts the search budget.
// This reproduction deliberately asserts the desired successful behavior.
test("bus_lanes routes the horizontal six-layer AM3352 DDR3 layout", async () => {
  const router = new BusLanesAutorouter(input as SimpleRouteJson)
  const traces = await new Promise<any[]>((resolve, reject) => {
    router.on("complete", ({ traces }) => resolve(traces))
    router.on("error", ({ error }) => reject(error))
    router.start()
  })
  expect(traces).toHaveLength(47)
  expect(traces.flatMap((trace) => trace.route.filter((p: any) => p.route_type === "via"))).toHaveLength(94)
}, 900_000)
