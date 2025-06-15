import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"

test("remote-autorouter-1 with legacy solve endpoint", async () => {
  const { autoroutingServerUrl } = getTestAutoroutingServer({
    failInFirstTrace: true,
  })

  const { circuit } = getTestFixture()

  // Create a basic circuit that needs routing
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        serverUrl: autoroutingServerUrl,
        serverMode: "job",
        inputFormat: "simplified",
      }}
    >
      <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const autoroutingErrors = circuitJson.filter(
    (el) => el.type === "pcb_autorouting_error",
  )
  // Verify routing request was made
  expect(autoroutingErrors).toMatchInlineSnapshot(`
    [
      {
        "error_type": "pcb_autorouting_error",
        "message": "Autorouting job failed: {\"message\":\"Failed to compute first trace (failInFirstTrace simulated error)\"} (capacity-autorouter@0.0.71)",
        "pcb_autorouting_error_id": "pcb_autorouting_error_0",
        "pcb_error_id": "job_0",
        "type": "pcb_autorouting_error",
      },
    ]
  `)
})
