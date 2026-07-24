import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("post-processes multiple differential pairs with one solver invocation", async () => {
  const { circuit } = getTestFixture()
  const differentialPairSolverEvents: any[] = []

  circuit.on("solver:started", (event) => {
    if (event.solverName === "DifferentialPairSolver") {
      differentialPairSolverEvents.push(event)
    }
  })

  circuit.add(
    <board width="28mm" height="18mm" autorouter="sequential-trace">
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <differentialpair
        name="PCIE"
        positiveConnection="PCIE_P"
        negativeConnection="PCIE_N"
        maxLengthSkew={0.08}
      />
      <testpoint name="USB_P_LEFT" footprintVariant="pad" pcbX={-10} pcbY={6} />
      <testpoint name="USB_P_RIGHT" footprintVariant="pad" pcbX={10} pcbY={6} />
      <testpoint name="USB_N_LEFT" footprintVariant="pad" pcbX={-10} pcbY={3} />
      <testpoint name="USB_N_RIGHT" footprintVariant="pad" pcbX={10} pcbY={3} />
      <testpoint
        name="PCIE_P_LEFT"
        footprintVariant="pad"
        pcbX={-10}
        pcbY={-3}
      />
      <testpoint
        name="PCIE_P_RIGHT"
        footprintVariant="pad"
        pcbX={10}
        pcbY={-3}
      />
      <testpoint
        name="PCIE_N_LEFT"
        footprintVariant="pad"
        pcbX={-10}
        pcbY={-6}
      />
      <testpoint
        name="PCIE_N_RIGHT"
        footprintVariant="pad"
        pcbX={10}
        pcbY={-6}
      />
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
      <trace
        name="PCIE_P"
        from=".PCIE_P_LEFT > .pin1"
        to=".PCIE_P_RIGHT > .pin1"
        pcbStraightLine
      />
      <trace
        name="PCIE_N"
        from=".PCIE_N_LEFT > .pin1"
        to=".PCIE_N_RIGHT > .pin1"
        pcbStraightLine
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(differentialPairSolverEvents).toHaveLength(1)
  expect(
    differentialPairSolverEvents[0].solverParams.differentialPairs,
  ).toHaveLength(2)
  expect(
    differentialPairSolverEvents[0].solverParams.differentialPairs.map(
      (differentialPair: { lengthTolerance: number }) =>
        differentialPair.lengthTolerance,
    ),
  ).toEqual([0.05, 0.08])
})
