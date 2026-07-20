import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "a board custom autorouter routes child traces alongside a circuitJson subcircuit",
  async () => {
    const { circuit: prefabCircuit } = getTestFixture()

    prefabCircuit.add(
      <board width="4mm" height="4mm" routingDisabled>
        <resistor
          name="R_PREFAB"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={2}
        />
        <resistor
          name="R_PREFAB2"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={2}
          connections={{ pin1: "R_PREFAB.R1" }}
        />
      </board>,
    )

    await prefabCircuit.renderUntilSettled()

    const prefabCircuitJson = prefabCircuit
      .getCircuitJson()
      .filter((element) => element.type !== "pcb_board") as CircuitJson
    const { circuit } = getTestFixture()

    const autorouterFn = createBasicAutorouter(async (simpleRouteJson) => {
      autorouterConnectionCount = simpleRouteJson.connections.length

      return simpleRouteJson.connections.map((connection) => {
        const [start, end] = connection.pointsToConnect
        const width =
          connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth

        return {
          type: "pcb_trace" as const,
          pcb_trace_id: `pcb_trace_${connection.name}`,
          connection_name: connection.name,
          route: [
            { route_type: "wire" as const, ...start, width },
            { route_type: "wire" as const, ...end, width },
          ],
        }
      })
    })

    circuit.add(
      <board autorouter={{ algorithmFn: autorouterFn }}>
        <subcircuit name="PREFAB" circuitJson={prefabCircuitJson} />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={0}
        />
        <capacitor
          name="C1"
          capacitance="1uF"
          footprint="0402"
          pcbX={4}
          pcbY={0}
        />
        <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()

    const pcb_trace = circuit.db.pcb_trace.list()
    expect(autorouterConnectionCount).toBe(1)
    expect(pcb_trace.length).toBe(2)

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
)
