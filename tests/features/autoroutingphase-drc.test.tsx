import type { Group } from "lib/components/primitive-components/Group/Group"
import { Group_runRoutingPhaseDrc } from "lib/components/primitive-components/Group/Group_runRoutingPhaseDrc"
import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const route = (leaveBoard: boolean) =>
  createBasicAutorouter(async (srj) =>
    srj.connections.map((connection) => {
      const [start, end] = connection.pointsToConnect
      const points = leaveBoard
        ? [start, { ...start, x: 12, y: 3 }, end]
        : [start, { ...start, y: 2 }, { ...end, y: 2 }, end]
      return {
        type: "pcb_trace" as const,
        pcb_trace_id: `${connection.name}_${leaveBoard ? "bad" : "fixed"}`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: points.map((point) => ({
          route_type: "wire" as const,
          x: point.x,
          y: point.y,
          layer: point.layer,
          width: 0.15,
        })),
      }
    }),
  )

test("phase DRC preserves historical failures after a successful reroute", async () => {
  for (const disabled of [false, true]) {
    const { circuit } = getTestFixture({
      platform: { routingDrcChecksDisabled: disabled },
    })
    const events: AutoroutingEndEvent[] = []
    circuit.on("autorouting:end", (event) => {
      events.push(event)
      // Intermediate diagnostics and converted traces must not leak into the live DB.
      expect(circuit.db.toArray().some((e) => "autorouting_phase" in e)).toBe(
        false,
      )
      expect(circuit.db.pcb_trace.list()).toHaveLength(0)
    })
    circuit.add(
      <board width={20} height={12}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
        <autoroutingphase
          name="initial"
          phaseIndex={0}
          autorouter={{ algorithmFn: route(true) }}
        />
        <autoroutingphase
          name="repair"
          phaseIndex={1}
          reroute
          connection="R1.pin1"
          autorouter={{ algorithmFn: route(false) }}
        />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" routingPhaseIndex={0} />
        <pcbnotetext
          text="Phase 0 leaves board; phase 1 repairs route"
          pcbY={4}
          fontSize={0.5}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(events).toHaveLength(2)
    if (disabled) {
      expect(events.every((event) => event.drcErrors === undefined)).toBe(true)
      continue
    }
    expect(events[0].drcErrors!.length).toBeGreaterThan(0)
    expect(
      events[0].drcErrors!.every(
        (error) =>
          "autorouting_phase" in error &&
          error.autorouting_phase?.name === "initial" &&
          error.autorouting_phase.routing_phase_index === 0,
      ),
    ).toBe(true)
    expect(events[1].drcErrors).toEqual([])
    expect(circuit.db.toArray().some((e) => "autorouting_phase" in e)).toBe(
      false,
    )
    const finalCircuitJson = structuredClone(circuit.db.toArray())
    const toleranceErrors = await Group_runRoutingPhaseDrc(
      circuit.firstChild as Group<any>,
      { output_pcb_traces: circuit.db.pcb_trace.list() },
      { subcircuit_id: events[1].subcircuit_id, routing_phase_index: 2 },
      { minBoardEdgeClearance: 10 },
    )
    expect(toleranceErrors!.length).toBeGreaterThan(0)
    expect(circuit.db.toArray()).toEqual(finalCircuitJson)
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
})
