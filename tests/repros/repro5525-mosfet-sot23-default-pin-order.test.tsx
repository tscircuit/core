import { expect, it } from "bun:test"
import { circuitJsonToSpice } from "circuit-json-to-spice"
import { Mosfet } from "lib/components/normal-components/Mosfet"
import { symbols, type SchSymbol } from "schematic-symbols"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("maps SOT-23 pads to G/S/D by default on <mosfet>", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={10} routingDisabled>
      {/* AO3400A datasheet (Alpha & Omega, rev 3.1, p.1): 1=G, 2=S, 3=D.
          BSS138 and 2N7002 use the same SOT-23 pin order. */}
      <mosfet
        name="Q1"
        channelType="n"
        mosfetMode="enhancement"
        footprint="sot23"
        manufacturerPartNumber="AO3400A"
        schY={1.5}
        connections={{
          gate: "net.GATE",
          source: "net.SOURCE",
          drain: "net.DRAIN",
        }}
      />
      {/* Explicit pinLabels still override the default order. */}
      <mosfet
        name="Q2"
        channelType="n"
        mosfetMode="enhancement"
        footprint="sot23"
        pcbY={-3}
        schY={-1.5}
        pinLabels={{ pin1: "drain", pin2: "source", pin3: "gate" }}
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
  for (const [pin, role] of [
    [1, "gate"],
    [2, "source"],
    [3, "drain"],
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
    expect(mosfet.portMap[role]).toBe(mosfet.portMap[`pin${pin}`])
    expect(circuit.selectOne(`.Q1 > .${role}`)).toBe(mosfet.portMap[role])
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
    const schematicComponent = circuit.db.schematic_component.get(
      schematicPort.schematic_component_id!,
    )!
    const symbol: SchSymbol = symbols.n_channel_e_mosfet_transistor_horz!
    const symbolPort = symbol.ports.find((p) => p.labels.includes(role))!
    expect(schematicPort.center.x - schematicComponent.center.x).toBeCloseTo(
      symbolPort.x - symbol.center.x,
    )
    expect(schematicPort.center.y - schematicComponent.center.y).toBeCloseTo(
      symbolPort.y - symbol.center.y,
    )
  }
  const q2 = circuit.selectOne(".Q2") as Mosfet
  for (const [pin, role] of [
    [1, "drain"],
    [2, "source"],
    [3, "gate"],
  ] as const) {
    expect(q2.portMap[role]).toBe(q2.portMap[`pin${pin}`])
  }
  const spice = circuitJsonToSpice(circuit.getCircuitJson())
  const mosfetSpice = spice.components.find((c) => c.name === "Q1")!
  expect(mosfetSpice.nodes.slice(0, 3)).toEqual(
    ["RD", "RG", "RS"].map(
      (name) => spice.components.find((c) => c.name === name)!.nodes[0],
    ),
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
