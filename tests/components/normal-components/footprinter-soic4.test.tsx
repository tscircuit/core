import { test, expect } from "bun:test"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprinter-soic4 with autorouter", () => {
  const { autoroutingServerUrl } = getTestAutoroutingServer()
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="30mm"
      height="10mm"
      autorouter={{
        serverUrl: autoroutingServerUrl,
        serverMode: "solve-endpoint",
        inputFormat: "simplified",
      }}
    >
      <pushbutton footprint="soic4" name="U1" schX={3} pcbX={5} />
    </board>,
  )

  circuit.render()

  const pcb_traces = circuit.db.pcb_trace.list()
  expect(pcb_traces.length).toBe(0)

  const source_ports = circuit.db.source_port.list()
  expect(source_ports.length).toBe(4)

  const pcb_ports = circuit.db.pcb_port.list()
  expect(pcb_ports.length).toBe(4)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
