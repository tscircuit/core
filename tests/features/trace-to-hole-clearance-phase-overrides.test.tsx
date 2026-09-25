import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("hole and pad clearance share board inheritance and routing-phase override behavior", async () => {
  for (const settings of [
    { group: undefined, phase: undefined, expected: 0.2 },
    { group: 0.3, phase: undefined, expected: 0.2 },
    { group: 0.3, phase: "0.5mm", expected: 0.5 },
    { group: 0.3, phase: 0, expected: 0 },
  ]) {
    const { circuit } = getTestFixture()
    const inputs: SimpleRouteJson[] = []
    const algorithmFn = createBasicAutorouter(async (srj) => {
      inputs.push(srj)
      return srj.connections.map(
        (connection): SimplifiedPcbTrace => ({
          type: "pcb_trace",
          pcb_trace_id: `${connection.name}_routed`,
          connection_name: connection.name,
          route: connection.pointsToConnect.map((point) => ({
            route_type: "wire",
            x: point.x,
            y: point.y,
            width: 0.15,
            layer: "top",
          })),
        }),
      )
    })
    circuit.add(
      <board
        width={20}
        height={12}
        minTraceToHoleEdgeClearance="0.2mm"
        minTraceToPadEdgeClearance="0.2mm"
        autorouter={{ local: true, algorithmFn }}
      >
        <group
          name="nested"
          subcircuit
          {...(settings.group === undefined
            ? {}
            : {
                minTraceToHoleEdgeClearance: settings.group,
                minTraceToPadEdgeClearance: settings.group,
              })}
        >
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
          <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
          <trace from=".R1 > .pin1" to=".R2 > .pin1" routingPhaseIndex={0} />
          <autoroutingphase
            phaseIndex={0}
            {...(settings.phase === undefined
              ? {}
              : {
                  minTraceToHoleEdgeClearance: settings.phase,
                  minTraceToPadEdgeClearance: settings.phase,
                })}
          />
        </group>
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(inputs.length).toBeGreaterThan(0)
    expect(
      inputs.every(
        (srj) =>
          srj.minTraceToHoleEdgeClearance === settings.expected &&
          srj.minTraceToPadEdgeClearance === settings.expected,
      ),
    ).toBe(true)
  }
})
