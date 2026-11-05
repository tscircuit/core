import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ESP32_S3_WROOM_1_N16 } from "./esp32-s3-wroom-1-n16-import"

test("full C2913199 custom symbol and split ground pads", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={36} routingDisabled>
      <ESP32_S3_WROOM_1_N16 name="U1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(49)
  expect(circuit.db.pcb_port.list()).toHaveLength(49)
  expect(circuit.db.schematic_port.list()).toHaveLength(41)
  expect(circuit.db.source_port.list()).toHaveLength(49)
  const sourcePorts = circuit.db.source_port.list()
  const pcbPorts = circuit.db.pcb_port.list()
  const pads = circuit.db.pcb_smtpad.list()
  for (let pin = 1; pin <= 40; pin++) {
    const pad = pads.find((p) => p.port_hints?.includes(`pin${pin}`))!
    const pcbPort = pcbPorts.find((p) => p.pcb_port_id === pad.pcb_port_id)!
    const sourcePort = sourcePorts.find(
      (p) => p.source_port_id === pcbPort.source_port_id,
    )!
    expect(sourcePort.pin_number).toBe(pin)
  }
  const splitPads = pads.filter((p) => p.port_hints?.includes("pin41"))
  expect(splitPads).toHaveLength(9)
  const splitSourceIds = splitPads.map(
    (pad) =>
      pcbPorts.find((p) => p.pcb_port_id === pad.pcb_port_id)!.source_port_id,
  )
  expect(new Set(splitSourceIds).size).toBe(9)
  const groups = circuit.db.source_component_internal_connection.list()
  expect(groups).toHaveLength(1)
  expect(groups[0].source_port_ids.toSorted()).toEqual(
    splitSourceIds.toSorted(),
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
