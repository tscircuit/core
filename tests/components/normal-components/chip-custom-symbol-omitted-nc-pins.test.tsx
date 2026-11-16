import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom schematic symbol omits floating no-connect markers for omitted PCB pins while keeping explicit NC ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm" routingDisabled>
      <chip
        name="BZ1"
        schX={-1.5}
        pcbX={-2.5}
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
        connections={{
          POS: "net.VDRIVE",
          NEG: "net.GND",
        }}
      />
      <chip
        name="BZ2"
        schX={2}
        pcbX={2.5}
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
        connections={{
          POS: "net.VDRIVE",
          NEG: "net.GND",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const bz1 = circuit.db.source_component.getWhere({ name: "BZ1" })!
  const bz1SourcePorts = circuit.db.source_port
    .list({ source_component_id: bz1.source_component_id })
    .sort((a, b) => (a.pin_number ?? 0) - (b.pin_number ?? 0))
  expect(bz1SourcePorts.map((p) => p.pin_number)).toEqual([1, 2, 3])
  expect(bz1SourcePorts[2]?.do_not_connect).toBe(true)

  const bz1PcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: bz1.source_component_id,
  })!
  const bz1PcbPorts = circuit.db.pcb_port.list({
    pcb_component_id: bz1PcbComponent.pcb_component_id,
  })
  const bz1PcbPads = circuit.db.pcb_smtpad.list({
    pcb_component_id: bz1PcbComponent.pcb_component_id,
  })
  expect(bz1PcbPorts).toHaveLength(3)
  expect(bz1PcbPads).toHaveLength(3)
  expect(
    bz1PcbPorts.some(
      (port) => port.source_port_id === bz1SourcePorts[2]!.source_port_id,
    ),
  ).toBe(true)

  const bz1SchComponent = circuit.db.schematic_component.getWhere({
    source_component_id: bz1.source_component_id,
  })!
  const bz1SchPorts = circuit.db.schematic_port
    .list({ schematic_component_id: bz1SchComponent.schematic_component_id })
    .sort((a, b) => (a.pin_number ?? 0) - (b.pin_number ?? 0))
  expect(bz1SchPorts.map((p) => p.pin_number)).toEqual([1, 2])

  const bz2 = circuit.db.source_component.getWhere({ name: "BZ2" })!
  const bz2SchComponent = circuit.db.schematic_component.getWhere({
    source_component_id: bz2.source_component_id,
  })!
  const bz2SchPorts = circuit.db.schematic_port
    .list({ schematic_component_id: bz2SchComponent.schematic_component_id })
    .sort((a, b) => (a.pin_number ?? 0) - (b.pin_number ?? 0))
  expect(bz2SchPorts.map((p) => p.pin_number)).toEqual([1, 2, 3])

  expect(circuit.db.source_pin_missing_trace_warning.list()).toHaveLength(0)

  const svg = convertCircuitJsonToSchematicSvg(circuit.getCircuitJson())
  const ncMarkerMatches = svg.match(/class="sch-port-no-connect"/g) ?? []
  expect(ncMarkerMatches).toHaveLength(1)
  expect(svg).toContain(
    `data-schematic-port-id="${bz2SchPorts[2]!.schematic_port_id}"`,
  )

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})
