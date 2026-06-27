import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SubcircuitChild = () => (
  <subcircuit name="SubcircuitChild" pcbX={2} pcbY={0} exposedNets={["GND"]}>
    <pinheader
      name="J2"
      pinCount={2}
      footprint="pinrow2"
      pcbX={0}
      pcbY={0}
      pinLabels={{ pin1: "B", pin2: "C" }}
      showSilkscreenPinLabels
      connections={{ C: "net.GND" }}
    />
  </subcircuit>
)

const SubcircuitConnectivityRepro = () => (
  <board name="SubcircuitParent" width="10mm" height="7mm">
    <pinheader
      name="J1"
      pinCount={1}
      footprint="pinrow1"
      pcbX={-3}
      pcbY={0}
      pinLabels={{ pin1: "A" }}
      showSilkscreenPinLabels
      connections={{ A: "net.GND" }}
    />

    <SubcircuitChild />

    <copperpour
      name="top_gnd_pour"
      layer="top"
      connectsTo="net.GND"
      padMargin="0.25mm"
      traceMargin="0.2mm"
    />

    <pcbnotetext
      text="Expected: copper pour connects to A and C, but clears around B."
      pcbX={0}
      pcbY={2.8}
      fontSize="0.22mm"
      anchorAlignment="center"
      color="#ffffff"
    />
    <pcbnotetext
      text="A is parent net.GND; C is child net.GND reached through exposedNets."
      pcbX={0}
      pcbY={2.5}
      fontSize="0.22mm"
      anchorAlignment="center"
      color="#ffffff"
    />
    <pcbnotetext
      text="B is a separate child pin, so the pour should clear around it."
      pcbX={0}
      pcbY={2.2}
      fontSize="0.22mm"
      anchorAlignment="center"
      color="#ffffff"
    />
  </board>
)

test("copper pour connects to exposed net across subcircuit boundary", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(<SubcircuitConnectivityRepro />)

  await circuit.renderUntilSettled()

  const gndNets = circuit.db.source_net
    .list()
    .filter((net) => net.name === "GND")
  expect(gndNets.length).toBe(2)

  const sourcePorts = circuit.db.source_port.list()
  const sourceTraces = circuit.db.source_trace.list()
  const parentAPort = sourcePorts.find((port) => port.name === "A")
  const childCPort = sourcePorts.find((port) => port.name === "C")
  expect(parentAPort).toBeDefined()
  expect(childCPort).toBeDefined()

  const boardGndNetId = sourceTraces.find((trace) =>
    trace.connected_source_port_ids.includes(parentAPort!.source_port_id),
  )?.connected_source_net_ids[0]
  const childGndNetId = sourceTraces.find((trace) =>
    trace.connected_source_port_ids.includes(childCPort!.source_port_id),
  )?.connected_source_net_ids[0]
  const boardGndNet = gndNets.find((net) => net.source_net_id === boardGndNetId)
  const childGndNet = gndNets.find((net) => net.source_net_id === childGndNetId)
  expect(childGndNet).toBeDefined()
  expect(boardGndNet).toBeDefined()

  const exposedNetTrace = sourceTraces.find((trace) => {
    if (trace.name !== "exposed_net.GND") return false
    const connectedNetIds = new Set(trace.connected_source_net_ids)
    return (
      trace.connected_source_port_ids.length === 0 &&
      connectedNetIds.has(childGndNet!.source_net_id) &&
      connectedNetIds.has(boardGndNet!.source_net_id)
    )
  })
  expect(exposedNetTrace).toBeDefined()

  const copperPours = circuit.db.pcb_copper_pour.list()
  expect(copperPours.length).toBeGreaterThan(0)
  expect(
    copperPours.some(
      (pour) => pour.source_net_id === boardGndNet?.source_net_id,
    ),
  ).toBe(true)

  const childBPort = circuit.db.source_port
    .list()
    .find((port) => port.name === "B")
  expect(childBPort?.subcircuit_connectivity_map_key).toBeUndefined()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
