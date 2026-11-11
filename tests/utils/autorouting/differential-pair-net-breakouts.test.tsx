import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("global breakout routing retains its differential constraint", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  const asyncErrors: string[] = []
  circuit.on("asyncEffect:end", (e) => {
    if (e.error) asyncErrors.push(String(e.error))
  })
  circuit.add(
    <board width={24} height={12} schematicDisabled autorouter="auto_local">
      <breakout name="B1" pcbX={-6} width={4} height={4}>
        <chip
          name="U1"
          footprint={differentialPairPathPads()}
          connections={{ pin1: "net.P", pin2: "net.N" }}
        />
        <breakoutpoint connection=".U1 > .pin1" pcbX={1.9} pcbY={0.5} />
        <breakoutpoint connection=".U1 > .pin2" pcbX={1.9} pcbY={-0.5} />
      </breakout>
      <breakout name="B2" pcbX={6} width={4} height={4}>
        <chip
          name="U2"
          footprint={differentialPairPathPads()}
          connections={{ pin1: "net.P", pin2: "net.N" }}
        />
        <breakoutpoint connection=".U2 > .pin1" pcbX={-1.9} pcbY={0.5} />
        <breakoutpoint connection=".U2 > .pin2" pcbX={-1.9} pcbY={-0.5} />
      </breakout>
      <pcbnotetext
        pcbY={4.5}
        fontSize={0.5}
        text="P/N paired in both breakouts and on board"
      />
      <differentialpair
        name="PAIR"
        positiveConnection="net.P"
        negativeConnection="net.N"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(asyncErrors).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(phases).toHaveLength(3)
  for (const phase of phases) {
    const input = phase.startSimpleRouteJson!
    expect(input.differentialPairs).toHaveLength(1)
    expect([...input.differentialPairs![0].connectionNames]).toEqual(
      input.connections.map((c) => c.name),
    )
    expect(input.connections).toHaveLength(2)
    for (const connection of input.connections) {
      expect(
        connection.pointsToConnect.map((point) => point.port_selector),
      ).not.toContain(undefined)
    }
  }
  expect(circuit.db.pcb_trace.list()).toHaveLength(6)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30000)
