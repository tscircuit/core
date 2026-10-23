import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouting:end reports routes spanning separate connections of the same net instead of blaming a saved path", async () => {
  const { circuit } = getTestFixture()
  const events: Array<{
    pcbTracePaths?: unknown
    pcbTracePathsUnavailableReason?: string
  }> = []

  circuit.on("autorouting:end", (event) => {
    events.push(event)
  })

  circuit.add(
    <board width="30" height="20">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "OUT", pin4: "IN" }}
        pcbX={0}
      />
      <resistor
        name="R1"
        resistance="330"
        footprint="0402"
        pcbX={-6}
        pcbY={0}
      />
      <led name="LED1" footprint="0402" pcbX={6} pcbY={0} />
      <trace from="U1.VCC" to="R1.pin1" />
      <trace from="U1.OUT" to="R1.pin2" />
      <trace from="R1.pin2" to="LED1.pin1" />
      <trace from="LED1.pin2" to="U1.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(3)

  const spanningEvent = events.find(
    (e) => e.pcbTracePathsUnavailableReason !== undefined,
  )
  expect(spanningEvent).toBeDefined()
  expect(spanningEvent?.pcbTracePaths).toBeUndefined()
  expect(spanningEvent?.pcbTracePathsUnavailableReason).toContain(
    "spans separate connections of the same net",
  )
  expect(spanningEvent?.pcbTracePathsUnavailableReason).not.toContain(
    'use autorouter="fanout"',
  )
})
