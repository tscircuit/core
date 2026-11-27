import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom schematic symbols omit unplaced NC PCB pins while preserving explicit NC markers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm" routingDisabled>
      {/* BZ1: exact #5571 repro — pin3 (NC) exists on footprint/pinLabels but is omitted from custom symbol */}
      <chip
        name="BZ1"
        schX={-2}
        footprint="sot23"
        pinLabels={{ pin1: "POS", pin2: "NEG", pin3: "NC" }}
        pinAttributes={{ pin3: { doNotConnect: true } }}
        symbol={
          <symbol>
            <schematicrect width={0.4} height={0.4} strokeWidth={0.03} />
            <port
              name="POS"
              pinNumber={1}
              direction="left"
              schX={-0.4}
              schY={0.1}
            />
            <port
              name="NEG"
              pinNumber={2}
              direction="left"
              schX={-0.4}
              schY={-0.1}
            />
          </symbol>
        }
      />
      {/* BZ2: custom symbol explicitly places pin3 (NC), so its schematic no-connect marker is preserved */}
      <chip
        name="BZ2"
        schX={2}
        footprint="sot23"
        pinLabels={{ pin1: "POS", pin2: "NEG", pin3: "NC" }}
        pinAttributes={{ pin3: { doNotConnect: true } }}
        symbol={
          <symbol>
            <schematicrect width={0.4} height={0.4} strokeWidth={0.03} />
            <port
              name="POS"
              pinNumber={1}
              direction="left"
              schX={-0.4}
              schY={0.1}
            />
            <port
              name="NEG"
              pinNumber={2}
              direction="left"
              schX={-0.4}
              schY={-0.1}
            />
            <port
              name="NC"
              pinNumber={3}
              direction="right"
              schX={0.4}
              schY={0}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const bz1 = circuit.db.source_component.getWhere({ name: "BZ1" })!
  const bz1SourcePorts = circuit.db.source_port
    .list()
    .filter((p) => p.source_component_id === bz1.source_component_id)
  expect(bz1SourcePorts.map((p) => p.pin_number).sort()).toEqual([1, 2, 3])

  const bz1Pin3Source = bz1SourcePorts.find((p) => p.pin_number === 3)!
  expect(bz1Pin3Source.do_not_connect).toBe(true)

  const bz1PcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: bz1.source_component_id,
  })!
  const bz1PcbPorts = circuit.db.pcb_port
    .list()
    .filter((p) => p.pcb_component_id === bz1PcbComponent.pcb_component_id)
  expect(bz1PcbPorts).toHaveLength(3)
  expect(
    bz1PcbPorts.some((p) => p.source_port_id === bz1Pin3Source.source_port_id),
  ).toBe(true)

  const bz1PcbPads = circuit.db.pcb_smtpad
    .list()
    .filter((p) => p.pcb_component_id === bz1PcbComponent.pcb_component_id)
  expect(bz1PcbPads).toHaveLength(3)

  const bz1SchComponent = circuit.db.schematic_component.getWhere({
    source_component_id: bz1.source_component_id,
  })!
  const bz1SchPorts = circuit.db.schematic_port
    .list()
    .filter(
      (p) =>
        p.schematic_component_id === bz1SchComponent.schematic_component_id,
    )
  expect(bz1SchPorts.map((p) => p.pin_number).sort()).toEqual([1, 2])
  expect(
    bz1SchPorts.some((p) => p.source_port_id === bz1Pin3Source.source_port_id),
  ).toBe(false)

  // BZ2 explicitly declares pin3 in its custom symbol -> schematic port & NC marker preserved
  const bz2 = circuit.db.source_component.getWhere({ name: "BZ2" })!
  const bz2SourcePorts = circuit.db.source_port
    .list()
    .filter((p) => p.source_component_id === bz2.source_component_id)
  const bz2Pin3Source = bz2SourcePorts.find((p) => p.pin_number === 3)!
  expect(bz2Pin3Source.do_not_connect).toBe(true)

  const bz2SchComponent = circuit.db.schematic_component.getWhere({
    source_component_id: bz2.source_component_id,
  })!
  const bz2SchPorts = circuit.db.schematic_port
    .list()
    .filter(
      (p) =>
        p.schematic_component_id === bz2SchComponent.schematic_component_id,
    )
  expect(bz2SchPorts.map((p) => p.pin_number).sort()).toEqual([1, 2, 3])
  expect(
    bz2SchPorts.some((p) => p.source_port_id === bz2Pin3Source.source_port_id),
  ).toBe(true)

  expect(circuit.db.source_pin_missing_trace_warning.list()).toHaveLength(0)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})
