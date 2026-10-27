import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

test("test-point autorouter defaults apply to all routed traces without selectors", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={12}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (srj) =>
          srj.connections.map((c) => ({
            type: "pcb_trace",
            pcb_trace_id: c.name,
            connection_name: c.source_trace_id ?? c.name,
            route: c.pointsToConnect.map((p) => ({
              route_type: "wire",
              x: p.x,
              y: p.y,
              layer: "bottom",
              width: 0.2,
            })),
          })),
        ),
      }}
    >
      <testpoint name="LEFT" pcbX={-7} padDiameter={1} layer="bottom" />
      <testpoint name="RIGHT" pcbX={7} padDiameter={1} layer="bottom" />
      <trace from="LEFT.pin1" to="RIGHT.pin1" />
      <autoroutingphase reroute addTestPoints maxDetour="10mm" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const generated = circuit.db.source_component
    .list()
    .filter((c) => c.name.startsWith("TP_AUTO_"))
  expect(generated).toHaveLength(1)
  const port = circuit.db.source_port.getWhere({
    source_component_id: generated[0]!.source_component_id,
  })!
  const pcbPort = circuit.db.pcb_port.getWhere({
    source_port_id: port.source_port_id,
  })!
  const pad = circuit.db.pcb_smtpad.getWhere({
    pcb_port_id: pcbPort.pcb_port_id,
  })!
  expect(pad.is_covered_with_solder_mask).toBe(false)
  expect(pad).toMatchObject({ shape: "circle", layer: "bottom", radius: 0.5 })
  expect(
    circuit.db.source_trace
      .list()
      .some((t) => t.connected_source_port_ids.includes(port.source_port_id)),
  ).toBe(true)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
