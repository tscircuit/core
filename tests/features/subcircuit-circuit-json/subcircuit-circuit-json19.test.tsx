import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit circuit JSON inflates source nets before their traces", async () => {
  const subcircuitCircuitJson = await renderToCircuitJson(
    <board width="18mm" height="12mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-3}
        connections={{ pin1: "net.SIGNAL", pin2: "net.GND" }}
      />
      <testpoint
        name="TP1"
        footprintVariant="pad"
        pcbX={3}
        connections={{ pin1: "net.SIGNAL" }}
      />
    </board>,
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="24mm" height="16mm">
      <subcircuit name="IMPORTED" circuitJson={subcircuitCircuitJson} />
      <pcbnotetext
        text="Imported SIGNAL and GND nets"
        pcbX={0}
        pcbY={6}
        fontSize={0.8}
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_net.list().map((sourceNet) => sourceNet.name),
  ).toEqual(expect.arrayContaining(["SIGNAL", "GND"]))
  expect(
    circuit.db.source_trace
      .list()
      .filter((sourceTrace) => sourceTrace.connected_source_net_ids.length > 0),
  ).toHaveLength(3)
  const pcbPortIds = new Set(
    circuit.db.pcb_port.list().map((pcbPort) => pcbPort.pcb_port_id),
  )
  const routePcbPortIds = circuit.db.pcb_trace
    .list()
    .flatMap((pcbTrace) => pcbTrace.route)
    .flatMap((routePoint) =>
      routePoint.route_type === "wire"
        ? [routePoint.start_pcb_port_id, routePoint.end_pcb_port_id]
        : [],
    )
    .filter((pcbPortId) => pcbPortId !== undefined)
  expect(
    routePcbPortIds.filter((pcbPortId) => !pcbPortIds.has(pcbPortId)),
  ).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
