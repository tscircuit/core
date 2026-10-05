import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an inner-layer route retains the net named by its autorouter connection", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={12}
      height={8}
      layers={4}
      schematicDisabled
      autorouter={{
        algorithmFn: createBasicAutorouter(async (srj) => {
          const connection = srj.connections.find((connection) =>
            connection.name.startsWith("source_net_"),
          )!
          const left = connection.pointsToConnect.find(
            (point) => point.x === -3,
          )!
          const right = connection.pointsToConnect.find(
            (point) => point.x === 3,
          )!
          // SRJ points and emitted copper use board-world millimeters:
          // +X right, +Y top, +Z above the board (right handed).
          // The existing through-vias expose logical surface ports, while
          // this physical route joins their barrels on inner1.
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "inner_vdd_bridge",
              connection_name: connection.name,
              route: [left, right].map(({ x, y }) => ({
                route_type: "wire" as const,
                x,
                y,
                width: 0.2,
                layer: "inner1",
              })),
            },
          ]
        }),
      }}
    >
      <net name="VDD" />
      {[-4, 4].map((x, index) => (
        <chip
          key={x}
          name={`J${index + 1}`}
          pcbX={x}
          footprint={
            <footprint>
              <smtpad
                shape="rect"
                width={0.6}
                height={0.6}
                portHints={["pin1"]}
              />
            </footprint>
          }
        />
      ))}
      <trace from=".J1 > .pin1" to=".V_LEFT > .top" pcbStraightLine />
      <trace from=".J2 > .pin1" to=".V_RIGHT > .top" pcbStraightLine />
      <via
        name="V_LEFT"
        pcbX={-3}
        outerDiameter={0.6}
        holeDiameter={0.3}
        fromLayer="top"
        toLayer="bottom"
        connectsTo="net.VDD"
      />
      <via
        name="V_RIGHT"
        pcbX={3}
        outerDiameter={0.6}
        holeDiameter={0.3}
        fromLayer="top"
        toLayer="bottom"
        connectsTo="net.VDD"
      />
      <trace from=".V_LEFT > .top" to="net.VDD" />
      <trace from=".V_RIGHT > .top" to="net.VDD" />
      <pcbnotetext
        text="VDD: existing through-vias joined on INNER1"
        pcbY={2.5}
        fontSize={0.4}
      />
      <pcbnotetext
        text="Inner bridge; existing surface pad connections"
        pcbY={-2.5}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const net = circuit.db.source_net.list().find((net) => net.name === "VDD")!
  expect(circuit.db.pcb_trace.list()).toHaveLength(3)
  expect(circuit.db.pcb_trace.get("inner_vdd_bridge")!.source_trace_id).toBe(
    net.source_net_id,
  )
  expect(circuit.db.pcb_via.list()).toHaveLength(2)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "inner1",
    showErrorsInTextOverlay: true,
  })
})
