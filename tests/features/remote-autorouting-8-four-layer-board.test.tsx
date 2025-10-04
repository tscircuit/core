import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"

test("remote autorouter handles four-layer board", async () => {
  const { autoroutingServerUrl } = getTestAutoroutingServer()
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="30mm"
      height="30mm"
      layers={4}
      autorouter={{
        serverUrl: autoroutingServerUrl,
        serverMode: "solve-endpoint",
        inputFormat: "simplified",
      }}
    >
      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
      <resistor
        name="R1"
        pcbX={-8}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <capacitor
        name="C1"
        pcbX={8}
        pcbY={0}
        capacitance="10nF"
        footprint="0402"
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
      <trace from=".U1 > .pin8" to=".C1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)
  expect(boards[0]?.num_layers).toBe(4)

  const traces = circuit.selectAll("trace")
  expect(traces.length).toBeGreaterThanOrEqual(2)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
