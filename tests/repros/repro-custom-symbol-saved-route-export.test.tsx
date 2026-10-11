import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a custom symbol exports its routed PCB path", async (): Promise<void> => {
  const { circuit } = getTestFixture()
  const routingEvents: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event): void => {
    routingEvents.push(event)
  })

  circuit.add(
    <board width={22} height={10}>
      <chip
        name="U1"
        pcbX={-4}
        pinLabels={{ pin1: ["pin1"] }}
        symbol={
          <symbol>
            <port
              name="pin1"
              pinNumber={1}
              direction="right"
              schX={0.5}
              schY={0}
            />
          </symbol>
        }
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={1} height={1} shape="rect" />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={4}
        pinLabels={{ pin1: ["pin1"] }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={1} height={1} shape="rect" />
          </footprint>
        }
      />
      <autoroutingphase name="signal-route" phaseIndex={0} />
      <trace from="U1.pin1" to="U2.pin1" routingPhaseIndex={0} />
      <pcbnotetext text="U1.pin1" pcbX={-4} pcbY={-1} fontSize={0.4} />
      <pcbnotetext text="U2.pin1" pcbX={4} pcbY={-1} fontSize={0.4} />
      <pcbnotetext
        text="U1 uses a custom symbol port"
        pcbY={3}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Trace routes; saved-path export succeeds"
        pcbY={-3}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(routingEvents).toHaveLength(1)
  expect(routingEvents[0]).toMatchObject({
    phaseName: "signal-route",
    routingPhaseIndex: 0,
    connectionCount: 1,
  })
  expect(routingEvents[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
  expect(routingEvents[0]!.pcbTracePaths).toHaveLength(1)
  const savedPath = routingEvents[0]!.pcbTracePaths![0]!
  expect(savedPath.connection).toBe(".U1 port.pin1")
  expect(circuit.selectAll(savedPath.connection)).toEqual(
    circuit.selectAll("U1.pin1"),
  )
  expect(circuit.selectAll(".U1 > port.pin1")).toHaveLength(0)
  expect(circuit.selectAll(".U1 port.pin1")).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
