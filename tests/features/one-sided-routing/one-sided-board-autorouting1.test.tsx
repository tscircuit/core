import { expect, test } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("one-sided board autorouting routes all traces on top layer only", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" layers={1} autorouter="auto-local">
      <resistor
        name="R1"
        footprint="0805"
        resistance="10k"
        pcbX={-10}
        pcbY={5}
      />
      <resistor
        name="R2"
        footprint="0805"
        resistance="10k"
        pcbX={10}
        pcbY={5}
      />
      <resistor
        name="R3"
        footprint="0805"
        resistance="10k"
        pcbX={-10}
        pcbY={-5}
      />
      <resistor
        name="R4"
        footprint="0805"
        resistance="10k"
        pcbX={10}
        pcbY={-5}
      />

      <trace from=".R1 .pin1" to=".R2 .pin1" />
      <trace from=".R3 .pin1" to=".R4 .pin1" />
      <trace from=".R1 .pin2" to=".R3 .pin2" />
      <trace from=".R2 .pin2" to=".R4 .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.db.pcb_board.list()[0]
  expect(board.num_layers).toBe(1)

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBeGreaterThan(0)

  for (const trace of traces) {
    if (trace.route) {
      for (const segment of trace.route) {
        if (segment.route_type === "wire") {
          expect(segment.layer).toBe("top")
        }
      }
    }
  }

  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(0)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
