import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SubcircuitChild = () => (
  <subcircuit name="SubcircuitChild" pcbX={2} pcbY={0}>
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
      text="Expected: copper pour connects to A, but clears around B and C."
      pcbX={0}
      pcbY={2.8}
      fontSize="0.22mm"
      anchorAlignment="center"
      color="#ffffff"
    />
    <pcbnotetext
      text="A is parent net.GND; child net.GND is not reached without exposedNets."
      pcbX={0}
      pcbY={2.5}
      fontSize="0.22mm"
      anchorAlignment="center"
      color="#ffffff"
    />
    <pcbnotetext
      text="B and C are child pins, so the parent pour should clear around both."
      pcbX={0}
      pcbY={2.2}
      fontSize="0.22mm"
      anchorAlignment="center"
      color="#ffffff"
    />
  </board>
)

test("copper pour does not connect to child net without exposedNets", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(<SubcircuitConnectivityRepro />)

  await circuit.renderUntilSettled()

  const gndNets = circuit.db.source_net
    .list()
    .filter((net) => net.name === "GND")
  expect(gndNets.length).toBe(2)

  const childGndNet = gndNets.find((net) =>
    net.subcircuit_connectivity_map_key?.startsWith("SubcircuitChild_"),
  )
  const boardGndNet = gndNets.find((net) =>
    net.subcircuit_connectivity_map_key?.startsWith("SubcircuitParent_"),
  )
  expect(childGndNet).toBeDefined()
  expect(boardGndNet).toBeDefined()

  const sourceTraces = circuit.db.source_trace.list()
  expect(
    sourceTraces.some((trace) => trace.name?.startsWith("exposed_net.")),
  ).toBe(false)
  expect(
    sourceTraces.some((trace) => {
      const connectedNetIds = new Set(trace.connected_source_net_ids)
      return (
        connectedNetIds.has(childGndNet!.source_net_id) &&
        connectedNetIds.has(boardGndNet!.source_net_id)
      )
    }),
  ).toBe(false)

  const copperPours = circuit.db.pcb_copper_pour.list()
  expect(copperPours.length).toBeGreaterThan(0)

  const pourNetIds = new Set(copperPours.map((pour) => pour.source_net_id))
  const gndNetIds = gndNets.map((net) => net.source_net_id)
  expect(gndNetIds.filter((netId) => pourNetIds.has(netId)).length).toBe(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
