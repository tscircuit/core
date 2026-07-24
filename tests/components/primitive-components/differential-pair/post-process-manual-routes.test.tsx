import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("includes manually routed differential pair members", async () => {
  const { circuit } = getTestFixture()
  let solverTraceConnectionNames: string[] = []

  circuit.on("solver:started", (event) => {
    if (event.solverName === "DifferentialPairSolver") {
      solverTraceConnectionNames =
        event.solverParams.simpleRouteJson.traces.map(
          (trace: { connection_name: string }) => trace.connection_name,
        )
    }
  })

  circuit.add(
    <board width="20mm" height="12mm">
      <differentialpair
        name="MANUAL"
        positiveConnection="MANUAL_P"
        negativeConnection="MANUAL_N"
        maxLengthSkew={0.05}
      />
      <testpoint name="P_LEFT" footprintVariant="pad" pcbX={-7} pcbY={2} />
      <testpoint name="P_RIGHT" footprintVariant="pad" pcbX={7} pcbY={2} />
      <testpoint name="N_LEFT" footprintVariant="pad" pcbX={-7} pcbY={-2} />
      <testpoint name="N_RIGHT" footprintVariant="pad" pcbX={7} pcbY={-2} />
      <trace
        name="MANUAL_P"
        from=".P_LEFT > .pin1"
        to=".P_RIGHT > .pin1"
        pcbPathRelativeTo=".P_LEFT > .pin1"
        pcbPath={[{ x: 7, y: 1 }]}
      />
      <trace
        name="MANUAL_N"
        from=".N_LEFT > .pin1"
        to=".N_RIGHT > .pin1"
        pcbPathRelativeTo=".N_LEFT > .pin1"
        pcbPath={[{ x: 7, y: -1 }]}
      />
      <pcbnotetext
        text="Manual routes are passed to the differential pair solver"
        pcbX={0}
        pcbY={5}
        fontSize={0.6}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pairSourceTraceIds = circuit.db.source_trace
    .list()
    .filter(({ name }) => name === "MANUAL_P" || name === "MANUAL_N")
    .map(({ source_trace_id }) => source_trace_id)

  expect(pairSourceTraceIds).toHaveLength(2)
  expect(solverTraceConnectionNames).toHaveLength(2)
  expect(solverTraceConnectionNames.sort()).toEqual(pairSourceTraceIds.sort())
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
