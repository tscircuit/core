import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createPhaseAutorouter = ({
  traceIdSuffix,
  midpointYOffset,
  phaseInputs,
}: {
  traceIdSuffix: string
  midpointYOffset: number
  phaseInputs: SimpleRouteJson[]
}) =>
  createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) => {
    phaseInputs.push(structuredClone(simpleRouteJson))

    return simpleRouteJson.connections.map((connection): SimplifiedPcbTrace => {
      const [start, end] = connection.pointsToConnect
      const width = connection.nominalTraceWidth ?? 0.15

      return {
        type: "pcb_trace",
        pcb_trace_id: `${connection.name}_${traceIdSuffix}`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: [
          {
            route_type: "wire",
            x: start!.x,
            y: start!.y,
            width,
            layer: start!.layer,
          },
          {
            route_type: "wire",
            x: (start!.x + end!.x) / 2,
            y: (start!.y + end!.y) / 2 + midpointYOffset,
            width,
            layer: start!.layer,
          },
          {
            route_type: "wire",
            x: end!.x,
            y: end!.y,
            width,
            layer: end!.layer,
          },
        ],
      }
    })
  })

test("repro: unbounded reroute phase is skipped", async () => {
  const { circuit } = getTestFixture()
  const initialPhaseInputs: SimpleRouteJson[] = []
  const reroutePhaseInputs: SimpleRouteJson[] = []

  circuit.add(
    <board width="18mm" height="12mm">
      <testpoint name="LEFT" pcbX={-7} pcbY={0} />
      <testpoint name="RIGHT" pcbX={7} pcbY={0} />

      <autoroutingphase
        phaseIndex={0}
        autorouter={{
          algorithmFn: createPhaseAutorouter({
            traceIdSuffix: "initial",
            midpointYOffset: 0,
            phaseInputs: initialPhaseInputs,
          }),
        }}
      />
      {/* An empty selector list reaches core's selector-free phase state while
          remaining valid against the currently released props schema. */}
      <autoroutingphase
        phaseIndex={1}
        reroute
        connections={[]}
        autorouter={{
          algorithmFn: createPhaseAutorouter({
            traceIdSuffix: "rerouted",
            midpointYOffset: 2,
            phaseInputs: reroutePhaseInputs,
          }),
        }}
      />

      <trace from=".LEFT > .pin1" to=".RIGHT > .pin1" routingPhaseIndex={0} />
      <pcbnotetext text="BUG: REROUTE PHASE SKIPPED" pcbX={0} pcbY={5} />
      <pcbnotetext text="STRAIGHT TRACE IS PHASE 0 OUTPUT" pcbX={0} pcbY={-4} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(initialPhaseInputs).toHaveLength(1)
  expect(reroutePhaseInputs).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()[0]!.pcb_trace_id).toEndWith("_initial")
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
