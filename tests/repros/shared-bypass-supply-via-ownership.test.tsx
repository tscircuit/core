import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a net-owned shared branch preserves its net on emitted vias", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={12}
      height={8}
      schematicDisabled
      autorouter={{
        algorithmFn: createBasicAutorouter(async (input) => {
          const locals = input.connections.filter(
            (connection) =>
              connection.pointsToConnect.length === 2 &&
              connection.pointsToConnect.some((point) => point.y === 0) &&
              connection.pointsToConnect.every(
                (point) => point.x === connection.pointsToConnect[0].x,
              ),
          )
          const start = locals
            .flatMap((connection) => connection.pointsToConnect)
            .find((point) => point.x === -4 && point.y === 0)!
          const end = locals
            .flatMap((connection) => connection.pointsToConnect)
            .find((point) => point.x === 4 && point.y === 0)!
          return [
            ...locals.map((connection, index) => ({
              type: "pcb_trace" as const,
              pcb_trace_id: `local_bypass_${index}`,
              connection_name: connection.name,
              route: connection.pointsToConnect.map((point) => ({
                route_type: "wire" as const,
                ...point,
                width: 0.2,
              })),
            })),
            {
              type: "pcb_trace",
              pcb_trace_id: "shared_supply_branch",
              // A merged router connection may retain a local trace's alias.
              connection_name: locals[0].name,
              route: [
                { route_type: "wire", ...start, width: 0.2 },
                { route_type: "wire", x: -2, y: 0, width: 0.2, layer: "top" },
                {
                  route_type: "via",
                  x: -2,
                  y: 0,
                  from_layer: "top",
                  to_layer: "bottom",
                },
                {
                  route_type: "wire",
                  x: -2,
                  y: 0,
                  width: 0.2,
                  layer: "bottom",
                },
                { route_type: "wire", x: 2, y: 0, width: 0.2, layer: "bottom" },
                {
                  route_type: "via",
                  x: 2,
                  y: 0,
                  from_layer: "bottom",
                  to_layer: "top",
                },
                { route_type: "wire", x: 2, y: 0, width: 0.2, layer: "top" },
                { route_type: "wire", ...end, width: 0.2 },
              ],
            },
          ]
        }),
      }}
    >
      {[
        { name: "C1", x: -4, y: 0 },
        { name: "C2", x: 4, y: 0 },
        { name: "U1", x: -4, y: 2 },
        { name: "U2", x: 4, y: 2 },
      ].map(({ name, x, y }) => (
        <chip
          key={name}
          name={name}
          pcbX={x}
          pcbY={y}
          connections={name.startsWith("U") ? { pin1: "net.VSYS" } : undefined}
          footprint={
            <footprint>
              <smtpad
                shape="rect"
                width={0.6}
                height={0.6}
                layer="top"
                portHints={["pin1"]}
              />
            </footprint>
          }
        />
      ))}
      <trace
        name="LOCAL_ONE"
        from=".C1 > .pin1"
        to=".U1 > .pin1"
        maxLength={3}
      />
      <trace
        name="LOCAL_TWO"
        from=".C2 > .pin1"
        to=".U2 > .pin1"
        maxLength={3}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-2}
        fontSize={0.45}
        text="VSYS branch: net-owned vias"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const vsys = circuit.db.source_net.list().find((net) => net.name === "VSYS")!
  expect(vsys.subcircuit_connectivity_map_key).toBeDefined()
  const branch = circuit.db.pcb_trace
    .list()
    .find((trace) => trace.pcb_trace_id === "shared_supply_branch")!
  expect(branch.source_trace_id).toBe(vsys.source_net_id)
  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(2)
  expect(vias.map((via) => via.subcircuit_connectivity_map_key)).toEqual([
    vsys.subcircuit_connectivity_map_key,
    vsys.subcircuit_connectivity_map_key,
  ])
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.includes("error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
