import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("emits the differential pair solver constructor arguments", async () => {
  const { circuit } = getTestFixture()
  let differentialPairSolverEvent: any

  circuit.on("solver:started", (event) => {
    if (event.solverName === "DifferentialPairSolver") {
      differentialPairSolverEvent = event
    }
  })

  circuit.add(
    <board width="20mm" height="12mm" autorouter="sequential-trace">
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <testpoint name="USB_P_LEFT" footprintVariant="pad" pcbX={-7} pcbY={2} />
      <testpoint name="USB_P_RIGHT" footprintVariant="pad" pcbX={7} pcbY={2} />
      <testpoint name="USB_N_LEFT" footprintVariant="pad" pcbX={-7} pcbY={-2} />
      <testpoint name="USB_N_RIGHT" footprintVariant="pad" pcbX={7} pcbY={-2} />
      <trace
        name="USB_P"
        from=".USB_P_LEFT > .pin1"
        to=".USB_P_RIGHT > .pin1"
        pcbStraightLine
      />
      <trace
        name="USB_N"
        from=".USB_N_LEFT > .pin1"
        to=".USB_N_RIGHT > .pin1"
        pcbStraightLine
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const positiveSourceTrace = circuit.db.source_trace.getWhere({
    name: "USB_P",
  })
  const negativeSourceTrace = circuit.db.source_trace.getWhere({
    name: "USB_N",
  })

  expect(differentialPairSolverEvent).toBeDefined()
  expect(differentialPairSolverEvent.componentName.replace(/#\d+/, "#")).toBe(
    "<board# />",
  )
  expect(differentialPairSolverEvent.solverParams.differentialPairs).toEqual([
    {
      connectionNames: [
        positiveSourceTrace?.source_trace_id,
        negativeSourceTrace?.source_trace_id,
      ],
      lengthTolerance: 0.05,
    },
  ])
  expect(
    differentialPairSolverEvent.solverParams.simpleRouteJson.differentialPairs,
  ).toEqual(differentialPairSolverEvent.solverParams.differentialPairs)
  expect(
    differentialPairSolverEvent.solverParams.simpleRouteJson.traces,
  ).toHaveLength(2)
})
