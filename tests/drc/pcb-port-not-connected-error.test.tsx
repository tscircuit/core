import { test, expect } from "bun:test"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("check each PCB port is connected", async () => {
  const { circuit } = getTestFixture()
  const { autoroutingServerUrl } = getTestAutoroutingServer({
    simulateIncompleteAutorouting: true,
  })

  circuit.add(
    <board
      autorouter={{
        serverUrl: autoroutingServerUrl,
      }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={3}
        pcbX={5}
        pcbY={0}
      />
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        pcbX={10}
        pcbY={0}
        schX={-3}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".R3 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const pcbTraces = circuitJson.filter((el) => el.type === "pcb_trace")
  const pcbPortNotConnectedErrors = circuitJson.filter(
    (el) => el.type === "pcb_port_not_connected_error",
  )
  expect(pcbPortNotConnectedErrors).toMatchInlineSnapshot(`
    [
      {
        "error_type": "pcb_port_not_connected_error",
        "message": "Ports [port, port] are not connected together through the same net.",
        "pcb_component_ids": [
          "pcb_component_0",
          "pcb_component_1",
        ],
        "pcb_port_ids": [
          "pcb_port_0",
          "pcb_port_2",
        ],
        "pcb_port_not_connected_error_id": "pcb_port_not_connected_error_trace_source_trace_0",
        "type": "pcb_port_not_connected_error",
      },
    ]
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
