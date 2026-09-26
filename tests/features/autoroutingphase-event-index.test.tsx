import { expect, test } from "bun:test"
import type { AutoroutingExecutionMetadata } from "lib/events"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("events distinguish sparse declared phase indices from actual routing order", async () => {
  const { circuit } = getTestFixture()
  const phases = [19, 7, undefined]
  const events = { start: [], progress: [], end: [] } as Record<
    "start" | "progress" | "end",
    AutoroutingExecutionMetadata[]
  >
  for (const eventType of ["start", "progress", "end"] as const) {
    circuit.on(`autorouting:${eventType}`, (event) =>
      events[eventType].push(event),
    )
  }
  const algorithmFn = createBasicAutorouter(async (input) =>
    input.connections.map((connection) => ({
      type: "pcb_trace" as const,
      pcb_trace_id: `${connection.name}_routed`,
      connection_name: connection.name,
      route: connection.pointsToConnect.map((point) => ({
        route_type: "wire" as const,
        x: point.x,
        y: point.y,
        layer: point.layer,
        width: 0.2,
      })),
    })),
  )
  circuit.add(
    <board width={20} height={16} autorouter={{ algorithmFn }}>
      {phases.map((phaseIndex, row) => (
        <group key={row}>
          <pcbnotetext
            text={`phase ${phaseIndex ?? "default"}`}
            pcbX={0}
            pcbY={5 - row * 4}
            fontSize={0.6}
          />
          <resistor
            name={`L${row}`}
            resistance="1k"
            footprint="0402"
            pcbX={-6}
            pcbY={4 - row * 4}
          />
          <resistor
            name={`R${row}`}
            resistance="1k"
            footprint="0402"
            pcbX={6}
            pcbY={4 - row * 4}
          />
          <trace
            from={`L${row}.1`}
            to={`R${row}.1`}
            routingPhaseIndex={phaseIndex}
          />
        </group>
      ))}
      <autoroutingphase phaseIndex={19} />
      <autoroutingphase phaseIndex={7} />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const phaseEvents of Object.values(events)) {
    expect(phaseEvents.map((event) => event.routingPhaseIndex)).toEqual([
      7,
      19,
      null,
    ])
    expect(
      phaseEvents.map((event) => event._actualRoutingPhaseOrderIndex),
    ).toEqual([0, 1, 2])
    expect(phaseEvents.map((event) => event.phaseOrdinal)).toEqual([1, 2, 3])
  }
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
