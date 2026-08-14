import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "default breakout routing should not emit a one-point net connection",
  async () => {
    const { circuit } = getTestFixture()
    const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

    circuit.add(
      <board width="12mm" height="8mm">
        <breakout name="B1">
          <net name="VCC" />
          <chip name="U1" footprint="soic8" pcbX={-1} />
          <breakoutpoint connection=".U1 > .pin1" pcbX={3} pcbY={1.905} />
          <trace from=".U1 > .pin1" to="net.VCC" />
        </breakout>
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
    await expect(
      autoroutingPhaseIoStack,
    ).toMatchAutoroutingPhaseIoStackSnapshot(
      import.meta.path,
      "default-breakout-one-point-net-autorouting-srj",
      circuit,
    )
    const onePointConnections = autoroutingPhaseIoStack.flatMap((phase) =>
      (phase.startSimpleRouteJson?.connections ?? []).filter(
        (connection) => connection.pointsToConnect.length < 2,
      ),
    )
    expect(onePointConnections).toEqual([])
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  },
)
