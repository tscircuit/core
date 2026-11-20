import { expect, test } from "bun:test"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("synchronous saved phases publish after the initiating render", async () => {
  const { circuit } = getTestFixture()
  const nextPhaseStarted = Promise.withResolvers<void>()
  const releaseNextPhase = Promise.withResolvers<void>()
  circuit.on("autorouting:error", ({ error }) => {
    nextPhaseStarted.reject(new Error(error.message))
  })
  circuit.add(
    <board width={16} height={12} schematicDisabled>
      <chip
        name="U1"
        pcbX={-5}
        pcbY={2}
        pinLabels={{ pin1: "START" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={5}
        pcbY={2}
        pinLabels={{ pin1: "END" }}
        footprint={
          <footprint>
            <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
          </footprint>
        }
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={-2}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={-2} />
      <autoroutingphase
        phaseIndex={0}
        connection="U1.1"
        pcbTracePaths={[
          {
            connection: "U1.START",
            route: [
              { route_type: "wire", x: -5, y: 2, width: 0.2, layer: "top" },
              { route_type: "wire", x: 5, y: 2, width: 0.2, layer: "top" },
            ],
          },
        ]}
      />
      <autoroutingphase
        phaseIndex={1}
        algorithmFn={createBasicAutorouter(async (simpleRouteJson) => {
          nextPhaseStarted.resolve()
          await releaseNextPhase.promise
          return simpleRouteJson.connections.map(
            (connection): SimplifiedPcbTrace => ({
              type: "pcb_trace",
              pcb_trace_id: `${connection.name}_routed`,
              connection_name: connection.source_trace_id ?? connection.name,
              route: connection.pointsToConnect.map((point) => ({
                route_type: "wire",
                ...point,
                width: 0.15,
              })),
            }),
          )
        })}
      />
      <trace from="U1.1" to="U2.1" routingPhaseIndex={0} />
      <trace from="R1.1" to="R2.1" routingPhaseIndex={1} />
    </board>,
  )

  const rendering = circuit.renderUntilSettled().then(() => {
    nextPhaseStarted.reject(
      new Error("Routing settled before the held phase started"),
    )
  })
  try {
    await nextPhaseStarted.promise
    expect(circuit.isDoneRendering()).toBeFalse()
    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
    expect(circuit.db.pcb_trace.list()[0].pcb_trace_id).toStartWith(
      "saved_phase_",
    )
  } finally {
    releaseNextPhase.resolve()
    await rendering
  }
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
})
