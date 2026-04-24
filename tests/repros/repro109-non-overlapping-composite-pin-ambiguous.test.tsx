import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro109: repeated portHints on non-overlapping pads create internally connected ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <chip
        name="U1"
        pinLabels={{
          pin1: "SIG",
        }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="-3mm"
              pcbY="0mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin1"]}
              pcbX="3mm"
              pcbY="0mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list({
    source_component_id: circuit.db.source_component.getWhere({ name: "U1" })
      ?.source_component_id,
  })
  const pcbPorts = circuit.db.pcb_port.list()
  const internalConnections =
    circuit.db.source_component_internal_connection.list()

  expect(sourcePorts).toHaveLength(2)
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(pcbPorts).toHaveLength(2)
  for (const sourcePort of sourcePorts) {
    expect(
      pcbPorts.filter(
        (pcbPort) => pcbPort.source_port_id === sourcePort.source_port_id,
      ),
    ).toHaveLength(1)
  }
  expect(internalConnections).toHaveLength(1)
  expect(internalConnections[0].source_port_ids.toSorted()).toEqual(
    sourcePorts.map((port) => port.source_port_id).toSorted(),
  )

  expect(
    convertCircuitJsonToPcbSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path)
})
