import { expect, test, spyOn } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("verify human-readable errors in autorouter diagnostics", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board width={10} height={10}>
      <resistor name="R1" pcbX={-2} pcbY={0} resistance="1k" footprint="0402" />
      <resistor name="R2" pcbX={2} pcbY={0} resistance="1k" footprint="0402" />
      <net name="MY_NET" />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Simulate an error by removing coordinates from a port
  const pcb_port = circuit.db.pcb_port.list()[0]
  pcb_port.x = undefined as any

  // Remove existing traces so the autorouter attempts to route them again
  for (const pcb_trace of circuit.db.pcb_trace.list()) {
    circuit.db.pcb_trace.delete(pcb_trace.pcb_trace_id)
  }

  const consoleSpy = spyOn(console, "error").mockImplementation(() => {})

  getSimpleRouteJsonFromCircuitJson({ db: circuit.db })

  expect(consoleSpy).toHaveBeenCalled()
  expect(consoleSpy.mock.calls[0][0]).toMatchInlineSnapshot(
    `"(pcb_port[.R1 > .pin1]) for trace source_trace_0 does not have x/y coordinates. Skipping this trace."`,
  )

  consoleSpy.mockRestore()
})
