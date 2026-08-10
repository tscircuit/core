import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor bypassFor/bypassTo create the bypass connection", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="16mm">
      <chip
        name="U1"
        footprint="soic8"
        pcbX={-4}
        pinLabels={{ 1: "VCC", 8: "GND" }}
        pinAttributes={{ VCC: { requiresPower: true } }}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={3}
        bypassFor=".U1 .VCC"
        bypassTo="net.GND"
      />
      <trace from=".U1 .GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // bypassFor/bypassTo are documented capacitor props. Before this fix they were
  // never consumed, so the capacitor emitted zero source traces and was left
  // unconnected. They now behave like decouplingFor/decouplingTo.
  const capSource = circuit.db.source_component.getWhere({ name: "C1" })!
  if (capSource.ftype !== "simple_capacitor") {
    throw new Error("C1 should be a simple_capacitor")
  }
  const capPorts = circuit.db.source_port.list({
    source_component_id: capSource.source_component_id,
  })
  const capPortIds = new Set(capPorts.map((p) => p.source_port_id))

  // both capacitor pins are wired up by the bypass props
  const capTraces = circuit.db.source_trace
    .list()
    .filter((t) => t.connected_source_port_ids.some((id) => capPortIds.has(id)))
  expect(capTraces.length).toBe(2)

  // one bypass trace lands on U1.VCC, the other on the GND net
  const vccPort = circuit.db.source_port.getWhere({ name: "VCC" })!
  const gndNet = circuit.db.source_net.getWhere({ name: "GND" })
  expect(gndNet).toBeDefined()

  const toVcc = capTraces.find((t) =>
    t.connected_source_port_ids.includes(vccPort.source_port_id),
  )
  const toGndNet = capTraces.find((t) =>
    t.connected_source_net_ids.includes(gndNet!.source_net_id),
  )
  expect(toVcc).toBeDefined()
  expect(toGndNet).toBeDefined()

  // treated as a decoupling cap end to end: the power-to-ground topology gets
  // the inferred max decoupling trace length
  expect(capSource.max_decoupling_trace_length).toBe(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
