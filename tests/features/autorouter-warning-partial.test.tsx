import { expect, test } from "bun:test"
import type { AutoroutingWarningEvent } from "lib/events"
import type { AutorouterWarningEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

test("warnings preserve partial routing and scope diagnostics without hiding missing connections", async () => {
  const { circuit } = getTestFixture()
  let warning: AutorouterWarningEvent | undefined
  const warningEvents: AutoroutingWarningEvent[] = []
  circuit.on("autorouting:warning", (event) => warningEvents.push(event))

  circuit.add(
    <board width="20mm" height="12mm">
      <subcircuit
        name="ROUTED_REGION"
        pcbX={2}
        pcbY={1}
        autorouter={{
          algorithmFn: createBasicAutorouter(
            async (input) => {
              const connection = input.connections.find((connection) =>
                connection.pointsToConnect.every((point) => point.y > 0),
              )!
              return [
                {
                  type: "pcb_trace",
                  pcb_trace_id: "completed_connection",
                  connection_name: connection.name,
                  route: connection.pointsToConnect.map((point) => ({
                    route_type: "wire",
                    x: point.x,
                    y: point.y,
                    layer: point.layer,
                    width: 0.15,
                  })),
                },
              ]
            },
            (input) => {
              const connection = input.connections.find((connection) =>
                connection.pointsToConnect.every((point) => point.y < 0),
              )!
              const point = connection.pointsToConnect[0]
              warning = {
                type: "warning",
                message:
                  "No legal via or direct route; left this connection unrouted",
                connection_name: connection.name,
                pcb_port_ids: connection.pointsToConnect.map(
                  (point) => point.pcb_port_id!,
                ),
                center: { x: point.x, y: point.y },
              }
              return [warning]
            },
          ),
        }}
      >
        <resistor
          name="A1"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbY={2}
        />
        <resistor
          name="A2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={2}
        />
        <resistor
          name="B1"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbY={-3}
        />
        <resistor
          name="B2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={-3}
        />
        <trace from="A1.pin2" to="A2.pin1" />
        <trace from="B1.pin2" to="B2.pin1" />
      </subcircuit>
      <pcbnotetext
        text="TOP ROUTED; BOTTOM LEFT UNROUTED WITH WARNING"
        pcbY={-4.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const routedRegion = circuit.db.source_group
    .list()
    .find((group) => group.name === "ROUTED_REGION")!
  const pcbWarnings = circuit.db.pcb_autorouter_warning.list()
  expect(pcbWarnings).toHaveLength(1)
  expect(pcbWarnings[0]).toMatchObject({
    type: "pcb_autorouter_warning",
    warning_type: "pcb_autorouter_warning",
    message: warning!.message,
    connection_name: warning!.connection_name,
    pcb_port_ids: warning!.pcb_port_ids,
    center: warning!.center,
    subcircuit_id: routedRegion.subcircuit_id,
  })
  expect(warningEvents).toHaveLength(1)
  expect(warningEvents[0]).toMatchObject({
    type: "autorouting:warning",
    subcircuit_id: routedRegion.subcircuit_id,
    warning,
  })
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_missing_error.list()).toHaveLength(1)
  expect(
    circuit.db.pcb_port_not_connected_error
      .list()
      .flatMap((error) => error.pcb_port_ids)
      .sort(),
  ).toEqual(warning!.pcb_port_ids!.toSorted())
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
