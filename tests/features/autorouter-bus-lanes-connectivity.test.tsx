import { expect, test } from "bun:test"
import { createBusLanesAutorouterConfig } from "../../index"
import * as checks from "@tscircuit/checks"
import { BusLanesConnectivityBoard } from "tests/fixtures/bus-lanes-connectivity"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core connectivity routing connects native pads and retains no failed candidates", async () => {
  for (const scope of ["board", "phase"] as const) {
    for (const maxPasses of [0, 300]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <BusLanesConnectivityBoard
          scope={scope}
          autorouter={createBusLanesAutorouterConfig({
            goal: "connectivity",
            connectivity: {
              gridStep: 0.5,
              maxPasses,
              maxExpansionsPerRoute: 100_000,
              maxRefinements: 2,
            },
          })}
        />,
      )
      await circuit.renderUntilSettled()
      const json = circuit.getCircuitJson()
      const traces = json.filter((element) => element.type === "pcb_trace")
      const routingErrors = json.filter(
        (element) => element.type === "pcb_autorouting_error",
      )
      if (maxPasses === 0) {
        expect(routingErrors.length).toBeGreaterThan(0)
        expect(traces).toEqual([])
        expect(json.filter((element) => element.type === "pcb_via")).toEqual([])
        continue
      }
      expect(routingErrors).toEqual([])
      expect(traces).toHaveLength(2)
      expect(json.filter((element) => element.type === "pcb_via")).toHaveLength(
        4,
      )
      expect(json.filter((element) => element.type.endsWith("_error"))).toEqual(
        [],
      )
      const clearance = { minClearance: 0.1 }
      expect([
        ...checks.checkSourceTracesHavePcbTraces(json),
        ...checks.checkEachPcbPortConnectedToPcbTraces(json),
        ...checks.checkTracesAreContiguous(json),
        ...checks.checkEachPcbTraceNonOverlapping(json, clearance),
        ...checks.checkPadTraceClearance(json, clearance),
        ...checks.checkViaTraceClearance(json, clearance),
        ...checks.checkViaPadClearance(json, clearance),
        ...checks.checkDifferentNetViaSpacing(json),
        ...checks.checkViasInPads(json),
      ]).toEqual([])
      if (scope === "phase")
        expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
}, 30_000)
