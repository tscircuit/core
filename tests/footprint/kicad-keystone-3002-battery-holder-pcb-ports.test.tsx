import { expect, test } from "bun:test"
import keystone3002Footprint from "tests/fixtures/assets/external-keystone-3002-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { kicadLoader } from "tests/fixtures/kicadLoader"

test("kicad BatteryHolder_Keystone_3002 positive pads get pcb_port and route cleanly", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: kicadLoader,
      },
    },
  })

  circuit.add(
    <board width="50mm" height="50mm">
      <chip
        name="BT1"
        footprint="kicad:Battery/BatteryHolder_Keystone_3002_1x2032"
        pinLabels={{ pin1: ["POS"], pin2: ["NEG"] }}
      />
      <chip name="U1" footprint="soic8" pcbX={15} pcbY={15} />
      <trace from=".BT1 > .POS" to=".U1 > .pin1" />
      <trace from=".BT1 > .pin1_internal_1" to=".U1 > .pin2" />
      <trace from=".BT1 > .NEG" to=".U1 > .pin3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const ambiguousErrors = circuitJson.filter(
    (e) => e.type === "source_ambiguous_port_reference",
  )
  expect(ambiguousErrors).toHaveLength(0)

  const btPads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.pcb_component_id === "pcb_component_0")
  expect(btPads).toHaveLength(3)
  expect(btPads.every((pad) => Boolean(pad.pcb_port_id))).toBe(true)

  const btPorts = circuit.db.pcb_port
    .list()
    .filter((port) => port.pcb_component_id === "pcb_component_0")
  expect(btPorts).toHaveLength(3)

  const internalConnections =
    circuit.db.source_component_internal_connection.list()
  expect(internalConnections).toHaveLength(1)

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(3)
})

test("Keystone 3002 passed directly as footprint circuit json array routes all pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <chip
        name="BT1"
        footprint={keystone3002Footprint as any}
        pinLabels={{ pin1: ["POS"], pin2: ["NEG"] }}
      />
      <chip name="U1" footprint="soic8" pcbX={15} pcbY={15} />
      <trace from=".BT1 > .pin1" to=".U1 > .pin1" />
      <trace from=".BT1 > .pin1_internal_1" to=".U1 > .pin2" />
      <trace from=".BT1 > .pin2" to=".U1 > .pin3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const ambiguousErrors = circuitJson.filter(
    (e) => e.type === "source_ambiguous_port_reference",
  )
  expect(ambiguousErrors).toHaveLength(0)

  const btPads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.pcb_component_id === "pcb_component_0")
  expect(btPads).toHaveLength(3)
  expect(btPads.every((pad) => Boolean(pad.pcb_port_id))).toBe(true)

  const btPorts = circuit.db.pcb_port
    .list()
    .filter((port) => port.pcb_component_id === "pcb_component_0")
  expect(btPorts).toHaveLength(3)

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(3)
})

test("Keystone 3002 with <battery> component routes pos, neg, and pin1_internal_1", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: kicadLoader,
      },
    },
  })

  circuit.add(
    <board width="50mm" height="50mm">
      <battery
        name="BT1"
        footprint="kicad:Battery/BatteryHolder_Keystone_3002_1x2032"
      />
      <chip name="U1" footprint="soic8" pcbX={15} pcbY={15} />
      <trace from=".BT1 > .pos" to=".U1 > .pin1" />
      <trace from=".BT1 > .pin1_internal_1" to=".U1 > .pin2" />
      <trace from=".BT1 > .neg" to=".U1 > .pin3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const ambiguousErrors = circuitJson.filter(
    (e) => e.type === "source_ambiguous_port_reference",
  )
  expect(ambiguousErrors).toHaveLength(0)

  const btPads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.pcb_component_id === "pcb_component_0")
  expect(btPads).toHaveLength(3)
  expect(btPads.every((pad) => Boolean(pad.pcb_port_id))).toBe(true)

  const btPorts = circuit.db.pcb_port
    .list()
    .filter((port) => port.pcb_component_id === "pcb_component_0")
  expect(btPorts).toHaveLength(3)

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(3)
})
