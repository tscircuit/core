import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ICS_43434 } from "tests/fixtures/ics43434-import/C5656610"

test("ICS-43434 imported ground polygons have internally connected PCB ports", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={9} routingDisabled>
      <ICS_43434 name="MIC1" pcbX={1.25} pcbY={-1.5} schX={-2} />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3.5}
        pcbY={-1}
        schX={2}
      />
      <trace from=".MIC1 > .GND" to=".R1 > .pin1" pcbStraightLine />
      <pcbnotetext
        text="C5656610: four pin3 polygons connected to GND"
        pcbX={0}
        pcbY={3.5}
        fontSize={0.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const microphone = circuit.db.source_component.getWhere({ name: "MIC1" })!
  const groundPorts = circuit.db.source_port
    .list({ source_component_id: microphone.source_component_id })
    .filter((port) => port.port_hints?.includes("pin3"))
  const groundPcbPorts = circuit.db.pcb_port
    .list()
    .filter((pcbPort) =>
      groundPorts.some(
        (port) => port.source_port_id === pcbPort.source_port_id,
      ),
    )
  const groundPads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.port_hints?.includes("pin3"))

  expect(groundPads).toHaveLength(4)
  expect(groundPorts).toHaveLength(4)
  expect(groundPcbPorts).toHaveLength(4)
  expect(new Set(groundPads.map((pad) => pad.pcb_port_id)).size).toBe(4)
  const internalConnection = circuit.db.source_component_internal_connection
    .list()
    .find(
      (connection) =>
        connection.source_component_id === microphone.source_component_id,
    )
  expect(internalConnection?.source_port_ids.toSorted()).toEqual(
    groundPorts.map((port) => port.source_port_id).toSorted(),
  )
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
