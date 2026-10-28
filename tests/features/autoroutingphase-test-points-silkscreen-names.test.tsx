import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

test("generated test point labels prefer net names, then trace names, then TP_n", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={14}
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
              layer: p.layer,
              width: 0.2,
            })),
          })),
        ),
      }}
    >
      <testpoint name="A1" pcbX={-7} pcbY={4} padDiameter={1} />
      <testpoint name="A2" pcbX={7} pcbY={4} padDiameter={1} />
      <testpoint name="B1" pcbX={-7} pcbY={0} padDiameter={1} />
      <testpoint name="B2" pcbX={7} pcbY={0} padDiameter={1} />
      <testpoint name="C1" pcbX={-7} pcbY={-4} padDiameter={1} />
      <testpoint name="C2" pcbX={7} pcbY={-4} padDiameter={1} />
      <net name="VSENSE" />
      <trace from="A1.pin1" to="net.VSENSE" />
      <trace from="A2.pin1" to="net.VSENSE" />
      <trace name="SCL" from="B1.pin1" to="B2.pin1" />
      <trace from="C1.pin1" to="C2.pin1" />
      <autoroutingphase
        reroute
        connections={["A1.pin1", "B1.pin1", "C1.pin1"]}
        addTestPoints
        testPointLayer="top"
        testPointMaxDetour={0}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const labels = circuit.db.source_component
    .list()
    .filter((component) => component.name.startsWith("TP_AUTO_"))
    .map((component) => {
      const pcbComponent = circuit.db.pcb_component.getWhere({
        source_component_id: component.source_component_id,
      })!
      return circuit.db.pcb_silkscreen_text.list({
        pcb_component_id: pcbComponent.pcb_component_id,
      })[0]!.text
    })
  expect(labels.sort()).toEqual(["SCL", "TP_1", "VSENSE"])

  // The net-routed test point joins the net itself
  const vsense = circuit.db.source_net.getWhere({ name: "VSENSE" })!
  const vsenseLabel = circuit.db.pcb_silkscreen_text.getWhere({
    text: "VSENSE",
  })!
  const vsensePort = circuit.db.pcb_port.getWhere({
    pcb_component_id: vsenseLabel.pcb_component_id!,
  })!
  expect(
    circuit.db.source_trace
      .list()
      .some(
        (trace) =>
          trace.connected_source_port_ids.includes(vsensePort.source_port_id) &&
          trace.connected_source_net_ids.includes(vsense.source_net_id),
      ),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
