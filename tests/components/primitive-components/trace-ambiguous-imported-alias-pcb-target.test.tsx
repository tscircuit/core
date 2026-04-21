import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ambiguous imported alias pin connects through inferred internal ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="J1"
        pcbX={-4}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1", "A1"]}
              pcbX="-1mm"
              pcbY="0mm"
              width="0.6mm"
              height="0.6mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2", "A1"]}
              pcbX="1mm"
              pcbY="0mm"
              width="0.6mm"
              height="0.6mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".J1 .A1" to=".R1 .pin1" pcbStraightLine />
    </board>,
  )

  await circuit.renderUntilSettled()

  const j1SourceComponent = circuit.db.source_component.getWhere({ name: "J1" })
  const j1SourcePorts = circuit.db.source_port.list({
    source_component_id: j1SourceComponent!.source_component_id,
  })
  const j1PcbPorts = circuit.db.pcb_port
    .list()
    .filter((pcbPort) =>
      j1SourcePorts.some(
        (sourcePort) => sourcePort.source_port_id === pcbPort.source_port_id,
      ),
    )
  const internalConnection = circuit.db.source_component_internal_connection
    .list()
    .find(
      (connection) =>
        connection.source_component_id ===
        j1SourceComponent!.source_component_id,
    )

  expect(j1SourcePorts).toHaveLength(2)
  expect(j1PcbPorts).toHaveLength(2)
  expect(internalConnection?.source_port_ids.toSorted()).toEqual(
    j1SourcePorts.map((port) => port.source_port_id).toSorted(),
  )
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
})
