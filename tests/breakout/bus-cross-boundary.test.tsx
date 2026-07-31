import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bus resolves the root connections of cross-boundary breakout traces", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="20mm" height="12mm" layers={4}>
      <breakout
        name="SOURCE_BREAKOUT"
        pcbX={-4}
        width="6mm"
        height="6mm"
        padding="0.7mm"
        autorouter="sequential-trace"
      >
        <chip
          name="U1"
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbX={0}
                pcbY={-0.5}
                width="0.5mm"
                height="0.5mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbX={0}
                pcbY={0.5}
                width="0.5mm"
                height="0.5mm"
                shape="rect"
              />
            </footprint>
          }
        />
        <bus name="DATA" connections={["D0", "D1"]} />
      </breakout>
      <pinheader
        name="J1"
        pinCount={2}
        footprint="pinrow2_p2.54"
        pcbX={4}
        pcbRotation={90}
      />
      <trace name="D0" from=".U1 > .pin1" to=".J1 > .pin1" />
      <trace name="D1" from=".U1 > .pin2" to=".J1 > .pin2" />
      <pcbnotetext
        text="DATA bus crosses the breakout boundary"
        pcbX={0}
        pcbY={5}
        fontSize="0.25mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(
    autoroutingPhaseIoStack.map(
      (phaseIo) => phaseIo.startSimpleRouteJson!.connections.length,
    ),
  ).toEqual([2, 2])
  for (const phaseIo of autoroutingPhaseIoStack) {
    const phaseInput = phaseIo.startSimpleRouteJson!
    expect(phaseInput.buses).toEqual([
      {
        busId: "DATA",
        name: "DATA",
        connectionNames: phaseInput.connections.map(
          (connection) => connection.name,
        ),
      },
    ])
  }
  const boardPhaseInput = autoroutingPhaseIoStack[1]!.startSimpleRouteJson!
  for (const connection of boardPhaseInput.connections) {
    expect(
      boardPhaseInput.obstacles.some(
        (obstacle) =>
          obstacle.obstacleId?.includes("_phase_") &&
          obstacle.connectedTo.includes(connection.name),
      ),
    ).toBe(true)
  }
  expect(
    circuit.db.pcb_trace
      .list()
      .every((pcbTrace) => pcbTrace.source_trace_id !== undefined),
  ).toBe(true)
  expect(circuit.db.pcb_trace_error.list()).toEqual([])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
