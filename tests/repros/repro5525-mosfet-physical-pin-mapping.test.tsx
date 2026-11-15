import { expect, it } from "bun:test"
import { circuitJsonToSpice } from "circuit-json-to-spice"
import { Mosfet } from "lib/components/normal-components/Mosfet"
import { symbols, type SchSymbol } from "schematic-symbols"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("maps AO3400A/BSS138 SOT-23 pads to G/S/D without changing schematic or SPICE terminals", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={10} routingDisabled>
      {/* Alpha & Omega AO3400A / onsemi BSS138 SOT-23 datasheet, page 1: 1=G, 2=S, 3=D. */}
      <mosfet
        name="Q1"
        channelType="n"
        mosfetMode="enhancement"
        footprint="sot23"
        manufacturerPartNumber="AO3400A"
        pinLabels={{ pin1: "gate", pin2: "source", pin3: "drain" }}
        connections={{
          gate: "net.GATE",
          source: "net.SOURCE",
          drain: "net.DRAIN",
        }}
      />
      <resistor
        name="RG"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={2}
        schX={-4}
        connections={{ pin1: "net.GATE", pin2: "net.GND" }}
      />
      <resistor
        name="RS"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={-2}
        schX={4}
        schY={-2}
        connections={{ pin1: "net.SOURCE", pin2: "net.GND" }}
      />
      <resistor
        name="RD"
        resistance="1k"
        footprint="0402"
        pcbX={4}
        schX={4}
        schY={2}
        connections={{ pin1: "net.DRAIN", pin2: "net.GND" }}
      />
      <pcbnotetext text="1 GATE" pcbX={-1.4} pcbY={1.6} fontSize={0.4} />
      <pcbnotetext text="2 SOURCE" pcbX={-1.4} pcbY={-1.6} fontSize={0.4} />
      <pcbnotetext text="3 DRAIN" pcbX={1.8} pcbY={0.7} fontSize={0.4} />
      <pcbnotetext text="AO3400A: 1=G  2=S  3=D" pcbY={3.8} fontSize={0.6} />
    </board>,
  )
  circuit.render()
  const mosfet = circuit.selectOne(".Q1") as Mosfet
  const pcbComponent = circuit.db.pcb_component
    .list()
    .find((p) => p.source_component_id === mosfet.source_component_id)!
  for (const [pin, role, alias] of [
    [1, "gate", "g"],
    [2, "source", "s"],
    [3, "drain", "d"],
  ] as const) {
    const pad = circuit.db.pcb_smtpad
      .list()
      .find(
        (p) =>
          p.pcb_component_id === pcbComponent.pcb_component_id &&
          p.port_hints?.includes(String(pin)),
      )!
    const pcbPort = circuit.db.pcb_port.get(pad.pcb_port_id!)!
    const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id!)!
    expect(sourcePort.port_hints).toContain(role)
    expect(sourcePort.port_hints).toContain(alias)
    expect(mosfet[role]).toBe(mosfet.portMap[`pin${pin}`])
    expect(circuit.selectOne(`.Q1 > .${alias}`)).toBe(mosfet[role])
    const net = circuit.db.source_net
      .list()
      .find((n) => n.name === role.toUpperCase())!
    expect(
      circuit.db.source_trace
        .list()
        .some(
          (t) =>
            t.connected_source_port_ids.includes(sourcePort.source_port_id) &&
            t.connected_source_net_ids.includes(net.source_net_id),
        ),
    ).toBe(true)
    const schematicPort = circuit.db.schematic_port
      .list()
      .find((p) => p.source_port_id === sourcePort.source_port_id)!
    const symbol: SchSymbol = symbols.n_channel_e_mosfet_transistor_horz!
    const symbolPort = symbol.ports.find((p) => p.labels.includes(role))!
    expect(schematicPort.center.x).toBeCloseTo(symbolPort.x)
    expect(schematicPort.center.y).toBeCloseTo(symbolPort.y)
  }
  const spice = circuitJsonToSpice(circuit.getCircuitJson())
  const mosfetSpice = spice.components.find((c) => c.name === "Q1")!
  expect(mosfetSpice.nodes).toEqual(
    ["RD", "RG", "RS"].map(
      (name) => spice.components.find((c) => c.name === name)!.nodes[0],
    ),
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
