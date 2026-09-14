import { expect, test } from "bun:test"
import { Fragment } from "react"
import type { PreflightRoutingCheckPolicy } from "@tscircuit/props"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("remaining routing preflight limits implicit phases to 50 connections", async () => {
  const scenarios: {
    policy?: PreflightRoutingCheckPolicy
    count: number
    routeRemaining?: boolean
    explicitCount?: number
    untargeted?: boolean
    nested?: boolean
    routed: number
    warning?: boolean
  }[] = [
    { policy: "basic", count: 51, routed: 0, warning: true },
    { policy: "conservative", count: 51, routed: 0, warning: true },
    { policy: "basic", count: 50, routed: 50 },
    { policy: "none", count: 51, routed: 51 },
    { count: 51, routed: 51 },
    { policy: "basic", count: 51, routeRemaining: true, routed: 51 },
    { policy: "basic", count: 51, routeRemaining: false, routed: 0 },
    { policy: "basic", count: 52, explicitCount: 1, routed: 1, warning: true },
    { policy: "basic", count: 52, explicitCount: 2, routed: 52 },
    { policy: "basic", count: 51, untargeted: true, routed: 51 },
    { policy: "basic", count: 51, nested: true, routed: 0, warning: true },
  ]
  for (const scenario of scenarios) {
    const { circuit } = getTestFixture()
    circuit.schematicDisabled = true
    const routedPhaseSizes: number[] = []
    const algorithmFn = createBasicAutorouter(async (input) => {
      routedPhaseSizes.push(input.connections.length)
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
    const connections = (
      <>
        {Array.from({ length: scenario.count }, (_, index) => (
          <Fragment key={index}>
            <resistor
              name={`R${index}A`}
              resistance="1k"
              footprint="0402"
              pcbX={(index % 6) * 12 - 33}
              pcbY={Math.floor(index / 6) * 3 - 12}
            />
            <resistor
              name={`R${index}B`}
              resistance="1k"
              footprint="0402"
              pcbX={(index % 6) * 12 - 27}
              pcbY={Math.floor(index / 6) * 3 - 12}
            />
            <trace from={`.R${index}A > .pin2`} to={`.R${index}B > .pin1`} />
          </Fragment>
        ))}
        {scenario.explicitCount && (
          <autoroutingphase
            phaseIndex={0}
            connections={Array.from(
              { length: scenario.explicitCount },
              (_, index) => `R${index}A.pin2`,
            )}
          />
        )}
        {scenario.untargeted && <autoroutingphase />}
      </>
    )
    circuit.add(
      <board
        width={75}
        height={35}
        preflightRoutingCheckPolicy={scenario.policy}
        routeRemaining={scenario.routeRemaining}
        autorouter={{ local: true, groupMode: "subcircuit", algorithmFn }}
      >
        {scenario.nested ? (
          <group name="child" subcircuit width={75} height={35}>
            {connections}
          </group>
        ) : (
          connections
        )}
        <pcbnotetext
          text={`${scenario.count} connections; ${scenario.routed} routed`}
          pcbX={0}
          pcbY={-16}
          fontSize={1}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(routedPhaseSizes.reduce((sum, count) => sum + count, 0)).toBe(
      scenario.routed,
    )
    expect(circuit.db.pcb_trace.list()).toHaveLength(scenario.routed)
    expect(circuit.db.pcb_port_not_connected_error.list()).toHaveLength(
      scenario.count - scenario.routed,
    )
    const warnings = circuit.db.source_property_ignored_warning
      .list()
      .filter((warning) => warning.property_name === "routeRemaining")
    expect(warnings).toHaveLength(scenario.warning ? 1 : 0)
    if (scenario.warning) {
      expect(warnings[0].message).toBe(
        `Remaining routes left unrouted (over 50 traces remaining and routingPreflightCheckPolicy="${scenario.policy}"). Set <board routeRemaining={true} /> or create <autoroutingphase /> elements for specific connections in the order you'd like to route them. The autorouter may hang unless you create autorouting phases incrementally.`,
      )
    }
    if (scenario === scenarios[0]) {
      await expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
}, 60_000)
