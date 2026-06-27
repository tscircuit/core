import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const PassiveInSubcircuit = () => (
  <subcircuit
    name="PassiveBlock"
    pcbX={2}
    pcbY={0}
    autorouter="sequential_trace"
    exposedNets={["GND"]}
  >
    <resistor name="R1" resistance="10k" footprint="0805" pcbX={0} pcbY={0} />
    <trace from=".R1 > .pin2" to="net.GND" />
  </subcircuit>
)

test("copper pour connects to exposed net across subcircuit boundary", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="10mm" height="7mm">
      <pinheader
        name="J1"
        pinCount={1}
        footprint="pinrow1"
        pcbX={-3}
        pcbY={0}
        connections={{ pin1: "net.GND" }}
      />

      <PassiveInSubcircuit />

      <trace from=".J1 > .pin1" to=".PassiveBlock > net.GND" />

      <copperpour
        name="top_gnd_pour"
        layer="top"
        connectsTo="net.GND"
        padMargin="0.25mm"
        traceMargin="0.2mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const gndNets = circuit.db.source_net
    .list()
    .filter((net) => net.name === "GND")
  expect(gndNets.length).toBe(2)

  const exposedNetTrace = circuit.db.source_trace.list().find((trace) => {
    if (trace.name !== "exposed_net.GND") return false
    const connectedNetIds = new Set(trace.connected_source_net_ids)
    return gndNets.every((net) => connectedNetIds.has(net.source_net_id))
  })
  expect(exposedNetTrace).toBeDefined()

  const boardGndNet = gndNets.find(
    (net) => net.source_net_id !== exposedNetTrace?.connected_source_net_ids[0],
  )
  const copperPours = circuit.db.pcb_copper_pour.list()
  expect(copperPours.length).toBeGreaterThan(0)
  expect(
    copperPours.some(
      (pour) => pour.source_net_id === boardGndNet?.source_net_id,
    ),
  ).toBe(true)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
