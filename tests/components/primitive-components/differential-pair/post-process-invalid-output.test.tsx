import { expect, test } from "bun:test"
import type { DifferentialPairConstraints } from "@tscircuit/length-matching-post-process"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { SOLVERS } from "lib/solvers"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects invalid solver output without changing PCB traces", async () => {
  const { circuit } = getTestFixture()
  const originalDifferentialPairSolver = SOLVERS.DifferentialPairSolver
  let pcbTracesAtSolverStart:
    | ReturnType<typeof circuit.db.pcb_trace.list>
    | undefined

  class InvalidDifferentialPairSolver {
    private readonly outputSimpleRouteJson: SimpleRouteJson

    constructor(
      simpleRouteJson: SimpleRouteJson,
      differentialPairs: readonly DifferentialPairConstraints[],
    ) {
      pcbTracesAtSolverStart = structuredClone(circuit.db.pcb_trace.list())
      this.outputSimpleRouteJson = structuredClone(simpleRouteJson)
      const differentialPairConnectionNames = new Set(
        differentialPairs.flatMap(
          (differentialPair) => differentialPair.connectionNames,
        ),
      )
      const unrelatedTrace = this.outputSimpleRouteJson.traces?.find(
        (trace) =>
          !differentialPairConnectionNames.has(
            trace.connection_name ??
              (
                trace as typeof trace & {
                  source_trace_id?: string
                }
              ).source_trace_id ??
              trace.pcb_trace_id,
          ),
      )
      const routePoint = unrelatedTrace?.route[0]
      if (!unrelatedTrace || routePoint?.route_type !== "wire") {
        throw new Error("Expected an unrelated routed wire trace")
      }
      routePoint.x += 1
    }

    solve(): void {}

    getOutput(): SimpleRouteJson {
      return this.outputSimpleRouteJson
    }
  }

  try {
    circuit.add(
      <board width="28mm" height="18mm" autorouter="sequential-trace">
        <differentialpair
          name="USB"
          positiveConnection="USB_P"
          negativeConnection="USB_N"
          maxLengthSkew={0.05}
        />
        <testpoint name="P_LEFT" footprintVariant="pad" pcbX={-10} pcbY={4} />
        <testpoint name="P_RIGHT" footprintVariant="pad" pcbX={10} pcbY={4} />
        <testpoint name="N_LEFT" footprintVariant="pad" pcbX={-10} pcbY={0} />
        <testpoint name="N_RIGHT" footprintVariant="pad" pcbX={10} pcbY={0} />
        <testpoint
          name="AUX_LEFT"
          footprintVariant="pad"
          pcbX={-10}
          pcbY={-4}
        />
        <testpoint
          name="AUX_RIGHT"
          footprintVariant="pad"
          pcbX={10}
          pcbY={-4}
        />
        <trace
          name="USB_P"
          from=".P_LEFT > .pin1"
          to=".P_RIGHT > .pin1"
          pcbStraightLine
        />
        <trace
          name="USB_N"
          from=".N_LEFT > .pin1"
          to=".N_RIGHT > .pin1"
          pcbStraightLine
        />
        <trace
          name="AUX"
          from=".AUX_LEFT > .pin1"
          to=".AUX_RIGHT > .pin1"
          pcbStraightLine
        />
      </board>,
    )

    SOLVERS.DifferentialPairSolver =
      InvalidDifferentialPairSolver as unknown as typeof SOLVERS.DifferentialPairSolver
    circuit.render()
  } finally {
    SOLVERS.DifferentialPairSolver = originalDifferentialPairSolver
  }

  await circuit.renderUntilSettled()

  expect(pcbTracesAtSolverStart).toBeDefined()
  expect(circuit.db.pcb_trace.list()).toEqual(pcbTracesAtSolverStart!)
  expect(
    circuit.db.pcb_autorouting_error
      .list()
      .filter((error) => error.message.includes("changed non-pair trace")),
  ).toHaveLength(1)
})
