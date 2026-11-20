import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a pair routed as two PCB traces per side gets a warning instead of local skew", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="30mm"
      height="6mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) =>
          simpleRouteJson.connections.flatMap((connection, index) => {
            const [start, end] = connection.pointsToConnect
            const middle = { x: 0, y: start.y, layer: "top" as const }
            return [
              {
                type: "pcb_trace" as const,
                pcb_trace_id: `trace_${index}_a`,
                connection_name: connection.name,
                route: [
                  { ...start, route_type: "wire" as const, width: 0.15 },
                  { ...middle, route_type: "wire" as const, width: 0.15 },
                ],
              },
              {
                type: "pcb_trace" as const,
                pcb_trace_id: `trace_${index}_b`,
                connection_name: connection.name,
                route: [
                  { ...middle, route_type: "wire" as const, width: 0.15 },
                  { ...end, route_type: "wire" as const, width: 0.15 },
                ],
              },
            ]
          }),
        ),
      }}
    >
      <testpoint
        name="P1"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={-12}
        pcbY={0.5}
      />
      <testpoint
        name="P2"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={12}
        pcbY={0.5}
      />
      <testpoint
        name="N1"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={-12}
        pcbY={-0.5}
      />
      <testpoint
        name="N2"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={12}
        pcbY={-0.5}
      />
      <trace name="DP" from=".P1 > .pin1" to=".P2 > .pin1" />
      <trace name="DN" from=".N1 > .pin1" to=".N2 > .pin1" />
      <differentialpair
        name="USB"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.85mm"
      />
      <pcbnotetext
        pcbY={2}
        fontSize={0.4}
        text="The router returns each side as two PCB traces, split at x = 0"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const bus = circuit.db.source_bus.list()[0]
  expect(
    circuit.db
      .toArray()
      .filter(
        (element) =>
          String(element.type) === "pcb_differential_pair_local_skew",
      ),
  ).toEqual([])
  expect(circuit.db.pcb_bus_routing_constraint_warning.list()).toEqual([
    expect.objectContaining({
      routing_rule: "route_geometry",
      source_bus_id: bus.source_bus_id,
      pcb_trace_ids: ["trace_0_a", "trace_0_b", "trace_1_a", "trace_1_b"],
      message: `No local skew for differential pair "USB" (${bus.source_bus_id} in ${bus.subcircuit_id}): the positive side is routed as 2 PCB traces and the negative side is routed as 2 PCB traces, and local skew follows one PCB trace per side.`,
    }),
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
