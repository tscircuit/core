import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"

test("remote autorouter handles four-layer board", async () => {
  const { autoroutingServerUrl } = getTestAutoroutingServer()
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="40mm"
      height="40mm"
      layers={4}
      autorouter={{
        serverUrl: autoroutingServerUrl,
        serverMode: "solve-endpoint",
        inputFormat: "simplified",
      }}
    >
      <chip name="U1" footprint="soic8" pcbX={-10} pcbY={10} />
      <chip name="U2" footprint="soic8" pcbX={10} pcbY={-10} />
      <chip name="U3" footprint="soic8" pcbX={12} pcbY={10} />
      <chip name="U4" footprint="soic8" pcbX={-12} pcbY={-10} />
      <resistor
        name="R1"
        pcbX={0}
        pcbY={14}
        resistance={100}
        footprint="0402"
      />
      <resistor
        name="R2"
        pcbX={0}
        pcbY={-14}
        resistance={220}
        footprint="0402"
      />
      <capacitor
        name="C1"
        pcbX={-4}
        pcbY={0}
        capacitance="10nF"
        footprint="0402"
      />
      <capacitor
        name="C2"
        pcbX={8}
        pcbY={0}
        capacitance="1uF"
        footprint="0402"
      />
      <trace from=".U1 > .pin1" to=".U2 > .pin5" />
      <trace from=".U1 > .pin4" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".U3 > .pin4" />
      <trace from=".U1 > .pin6" to=".R2 > .pin2" />
      <trace from=".U2 > .pin1" to=".U3 > .pin5" />
      <trace from=".U2 > .pin3" to=".C2 > .pin1" />
      <trace from=".U2 > .pin8" to=".U4 > .pin3" />
      <trace from=".U3 > .pin2" to=".C2 > .pin2" />
      <trace from=".U3 > .pin7" to=".U4 > .pin6" />
      <trace from=".U4 > .pin1" to=".R2 > .pin1" />
      <trace from=".U4 > .pin7" to=".C1 > .pin2" />
      <trace from=".C1 > .pin1" to=".U1 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(1)
  expect(boards[0]?.num_layers).toBe(4)

  const traces = circuit.selectAll("trace")
  expect(traces.length).toBeGreaterThanOrEqual(12)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
