import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("platform routingDisabled disables autorouting", async () => {
  const { circuit } = getTestFixture({
    platform: {
      routingDisabled: true,
    },
  })
  const { autoroutingServerUrl } = getTestAutoroutingServer()

  const cloudAutorouterConfig = {
    serverUrl: autoroutingServerUrl,
    serverMode: "solve-endpoint",
    inputFormat: "simplified",
  } as const

  circuit.add(
    <board width="10mm" height="10mm" autorouter={cloudAutorouterConfig}>
      <resistor footprint="0402" resistance={1000} name="R1" pcbX={-2} />
      <resistor footprint="0402" resistance={1000} name="R2" pcbX={2} />
      <trace from=".R1 .1" to=".R2 .1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(su(circuit.getCircuitJson()).pcb_trace.list()).toHaveLength(0)
})
