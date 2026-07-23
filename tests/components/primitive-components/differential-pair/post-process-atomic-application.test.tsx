import { expect, test } from "bun:test"
import type {
  SimpleRouteDifferentialPair,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { SOLVERS } from "lib/solvers"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("atomically applies changed pair routes without changing unrelated traces", async () => {
  const { circuit } = getTestFixture()
  const originalDifferentialPairSolver = SOLVERS.DifferentialPairSolver
  let changedPcbTraceId: string | undefined
  let changedRoutePointCount = 0
  let unrelatedInputTrace: SimplifiedPcbTrace | undefined

  class SuccessfulDifferentialPairSolver {
    private readonly outputSimpleRouteJson: SimpleRouteJson

    constructor(
      simpleRouteJson: SimpleRouteJson,
      differentialPairs: readonly SimpleRouteDifferentialPair[],
    ) {
      this.outputSimpleRouteJson = structuredClone(simpleRouteJson)
      const positiveConnectionName = differentialPairs[0]?.connectionNames[0]
      const positiveTrace = this.outputSimpleRouteJson.traces?.find(
        (trace) =>
          trace.connection_name === positiveConnectionName ||
          (
            trace as SimplifiedPcbTrace & {
              source_trace_id?: string
            }
          ).source_trace_id === positiveConnectionName,
      )
      const differentialPairConnectionNames = new Set(
        differentialPairs.flatMap(
          (differentialPair) => differentialPair.connectionNames,
        ),
      )
      const unrelatedTrace = this.outputSimpleRouteJson.traces?.find(
        (trace) => {
          const connectionName =
            trace.connection_name ??
            (
              trace as SimplifiedPcbTrace & {
                source_trace_id?: string
              }
            ).source_trace_id
          return (
            connectionName &&
            !differentialPairConnectionNames.has(connectionName)
          )
        },
      )
      if (!positiveTrace) {
        throw new Error("Expected a routed positive differential-pair trace")
      }
      unrelatedInputTrace = unrelatedTrace
        ? structuredClone(unrelatedTrace)
        : undefined

      const firstRoutePoint = positiveTrace.route[0]
      const secondRoutePoint = positiveTrace.route[1]
      if (
        firstRoutePoint?.route_type !== "wire" ||
        secondRoutePoint?.route_type !== "wire"
      ) {
        throw new Error("Expected the positive trace to begin with two wires")
      }
      positiveTrace.route.splice(1, 0, {
        ...firstRoutePoint,
        x: (firstRoutePoint.x + secondRoutePoint.x) / 2,
        y: (firstRoutePoint.y + secondRoutePoint.y) / 2 + 0.25,
      })
      changedPcbTraceId = positiveTrace.pcb_trace_id
      changedRoutePointCount = positiveTrace.route.length
    }

    solve(): void {}

    getOutput(): SimpleRouteJson {
      return this.outputSimpleRouteJson
    }
  }

  SOLVERS.DifferentialPairSolver =
    SuccessfulDifferentialPairSolver as unknown as typeof SOLVERS.DifferentialPairSolver

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
        <pcbnotetext
          pcbX={0}
          pcbY={7}
          fontSize={0.65}
          text="Differential-pair post-process: USB_P / USB_N | max skew 0.05mm | successful atomic pair replacement"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(changedPcbTraceId).toBeDefined()
    expect(circuit.db.pcb_trace.get(changedPcbTraceId!)?.route).toHaveLength(
      changedRoutePointCount,
    )
    expect(unrelatedInputTrace).toBeDefined()
    expect(circuit.db.pcb_trace.get(unrelatedInputTrace!.pcb_trace_id)).toEqual(
      expect.objectContaining({
        pcb_trace_id: unrelatedInputTrace!.pcb_trace_id,
        route: unrelatedInputTrace!.route,
      }),
    )
    expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  } finally {
    SOLVERS.DifferentialPairSolver = originalDifferentialPairSolver
  }
})
