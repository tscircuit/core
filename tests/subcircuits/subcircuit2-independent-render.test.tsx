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
    expect(errors).toMatchInlineSnapshot(`
      [
        {
          "error_type": "pcb_port_not_connected_error",
          "message": "pcb_port_not_connected_error: Pcb ports [pcb_port_1, pcb_port_2] are not connected together through the same net.",
          "pcb_component_ids": [
            "pcb_component_0",
            "pcb_component_1",
          ],
          "pcb_port_ids": [
            "pcb_port_1",
            "pcb_port_2",
          ],
          "pcb_port_not_connected_error_id": "pcb_port_not_connected_error_trace_source_trace_0",
          "type": "pcb_port_not_connected_error",
        },
      ]
    `)

    const traces = circuit.db.pcb_trace.list()
    expect(traces.length).toBe(1)

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  })
})
