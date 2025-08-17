import { test, expect, describe } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

describe("subcircuit2-independent-render", () => {
  test("should be able to disable routing within a subcircuit", async () => {
    const { circuit } = await getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm" autorouter="sequential-trace">
        <subcircuit name="subcircuit1" routingDisabled>
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
          <resistor name="R2" resistance="2k" footprint="0402" pcbX={2} />
          <trace from=".R1 .pin2" to=".R2 .pin1" />
        </subcircuit>
        <resistor name="R3" resistance="3k" footprint="0402" pcbY={2} />
        <trace from=".subcircuit1 .R1 .pin1" to=".R3 .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()

    const errors = circuit.db.toArray().filter((e) => e.type.includes("error"))
    expect(errors.length).toBe(0)

    const traces = circuit.db.pcb_trace.list()
    expect(traces.length).toBe(1)

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })
})
