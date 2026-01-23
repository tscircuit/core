import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"

test("remote-autorouter-7 with preset config", async () => {
  const { autoroutingServerUrl } = getTestAutoroutingServer()
  const { circuit } = getTestFixture()

  const asyncEffectStartEvents: any[] = []
  circuit.on("asyncEffect:start", (event) => {
    asyncEffectStartEvents.push({
      ...event,
      componentDisplayName: event.componentDisplayName.replace(/#\d+/, "#"),
    })
  })

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{ preset: "auto-cloud", serverUrl: autoroutingServerUrl }}
    >
      <resistor name="R2" pcbX={5} pcbY={0} resistance={100} footprint="0402" />
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={100}
        footprint="0402"
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    asyncEffectStartEvents.map(({ asyncEffectId, ...rest }) => rest),
  ).toMatchInlineSnapshot(`
    [
      {
        "componentDisplayName": "<board# />",
        "effectName": "make-http-autorouting-request",
        "phase": "PcbTraceRender",
      },
    ]
  `)

  const traces = circuit.selectAll("trace")
  expect(traces.length).toBe(1)
})
