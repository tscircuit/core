import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A net whose port belongs to two connections is routed as a tree that reaches
// one port through the other. Saved paths join endpoints of a single connection,
// so the exporter cannot represent that shape and reports why. This pins the
// report: it has to name the spanning route and must not send users chasing
// autorouter="fanout", which provably does not change the result.
test("branch net reports the spanning route instead of blaming the saved path", async () => {
  const { circuit } = getTestFixture()
  const events: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => events.push(event))
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
      <pcbnotetext
        text="U1.OUT, R1.pin2 and LED1.pin1 share a net"
        pcbX={0}
        pcbY={-8}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const reason = events[0]!.pcbTracePathsUnavailableReason ?? ""
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  // The router's copper is real; only the replayable artifact is unavailable.
  expect(circuit.db.pcb_trace.list().length).toBe(4)
  expect(reason).toContain(".LED1 > port.pin1")
  expect(reason).toContain(".U1 > port.OUT")
  expect(reason).toContain("spans separate connections")
  expect(reason).not.toContain('autorouter="fanout"')
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 60_000)
