import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

test("a recoverable autorouter warning is recorded before successful completion", async () => {
  const { circuit } = getTestFixture()
  const eventOrder: string[] = []
  circuit.on("autorouting:warning", () => eventOrder.push("warning"))
  circuit.on("autorouting:end", () => eventOrder.push("complete"))

  circuit.add(
    <board
      width="16mm"
      height="8mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(
          async (input) =>
            input.connections.map((connection) => ({
              type: "pcb_trace",
              pcb_trace_id: "recovered_trace",
              connection_name: connection.name,
              route: connection.pointsToConnect.map((point) => ({
                route_type: "wire",
                x: point.x,
                y: point.y,
                layer: point.layer,
                width: 0.15,
              })),
            })),
          () => [{ type: "warning", message: "Used a direct fallback route" }],
        ),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from="R1.pin2" to="R2.pin1" />
      <pcbnotetext text="WARNING: FALLBACK ROUTE COMPLETED" pcbY={-2} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(eventOrder).toEqual(["warning", "complete"])
  expect(circuit.db.pcb_autorouter_warning.list()).toMatchObject([
    {
      type: "pcb_autorouter_warning",
      warning_type: "pcb_autorouter_warning",
      message: "Used a direct fallback route",
      subcircuit_id: circuit.db.source_group.list()[0].subcircuit_id,
    },
  ])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_missing_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouter_warning.list()).toHaveLength(1)
})
