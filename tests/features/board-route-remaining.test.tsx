import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routeRemaining skips implicit routing while retaining explicit phases and unrouted DRC", async () => {
  for (const scenario of [
    { name: "disabled", routeRemaining: false, phase: "numbered", routed: 1 },
    { name: "enabled", routeRemaining: true, phase: "numbered", routed: 2 },
    {
      name: "default",
      routeRemaining: undefined,
      phase: "numbered",
      routed: 2,
    },
    { name: "no_phases", routeRemaining: false, phase: "none", routed: 0 },
    {
      name: "unnumbered",
      routeRemaining: false,
      phase: "unnumbered",
      routed: 2,
    },
    { name: "nested", routeRemaining: false, phase: "numbered", routed: 1 },
    { name: "targeted", routeRemaining: false, phase: "targeted", routed: 1 },
    { name: "trace_phase", routeRemaining: false, phase: "trace", routed: 1 },
    { name: "breakout", routeRemaining: false, phase: "breakout", routed: 1 },
  ]) {
    const { circuit } = getTestFixture()
    let routedConnectionCount = 0
    const algorithmFn = createBasicAutorouter(async (input) => {
      routedConnectionCount += input.connections.length
      return input.connections.map((connection) => ({
        type: "pcb_trace" as const,
        pcb_trace_id: `${connection.name}_routed`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: connection.pointsToConnect.map((point) => ({
          route_type: "wire" as const,
          x: point.x,
          y: point.y,
          width: 0.15,
          layer: point.layer,
        })),
      }))
    })
    const components = (
      <>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-3}
          pcbY={2}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={3}
          pcbY={2}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={-3}
          pcbY={-2}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          pcbX={3}
          pcbY={-2}
        />
        {scenario.phase === "numbered" && (
          <autoroutingphase phaseIndex={0} connection="R1.pin2" />
        )}
        {scenario.phase === "unnumbered" && <autoroutingphase />}
        {scenario.phase === "targeted" && (
          <autoroutingphase connection="R1.pin2" />
        )}
        {scenario.phase === "breakout" ? (
          <breakout
            name="fanout"
            autorouter={{ local: true, groupMode: "subcircuit", algorithmFn }}
          >
            <trace from=".R1 > .pin2" to=".R2 > .pin1" />
          </breakout>
        ) : (
          <trace
            from=".R1 > .pin2"
            to=".R2 > .pin1"
            routingPhaseIndex={scenario.phase === "trace" ? 0 : undefined}
          />
        )}
        <trace from=".R3 > .pin2" to=".R4 > .pin1" />
      </>
    )
    circuit.add(
      <board
        width={12}
        height={10}
        routeRemaining={scenario.routeRemaining}
        autorouter={{ local: true, groupMode: "subcircuit", algorithmFn }}
      >
        {scenario.name === "nested" ? (
          <group name="child" subcircuit>
            {components}
          </group>
        ) : (
          components
        )}
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(routedConnectionCount).toBe(scenario.routed)
    expect(circuit.db.pcb_trace.list()).toHaveLength(scenario.routed)
    const errors = circuit.db.pcb_port_not_connected_error.list()
    expect(errors).toHaveLength(2 - scenario.routed)
    if (scenario.routed === 1) {
      expect(errors[0].message).toContain("R3.pin2")
      expect(errors[0].message).toContain("R4.pin1")
    }
    await expect(circuit).toMatchPcbSnapshot(
      `${import.meta.path}-${scenario.name}`,
    )
  }
})
