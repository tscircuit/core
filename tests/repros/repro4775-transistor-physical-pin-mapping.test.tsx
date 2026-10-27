import { expect, it } from "bun:test"
import { circuitJsonToSpice } from "circuit-json-to-spice"
import { Transistor } from "lib/components/normal-components/Transistor"
import { symbols, type SchSymbol } from "schematic-symbols"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("maps MMBT3904 SOT-23 pads to B/E/C without changing schematic or SPICE terminals", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={10} routingDisabled>
      {/* Nexperia MMBT3904 datasheet, page 1: 1=B, 2=E, 3=C.
          https://assets.nexperia.com/documents/data-sheet/MMBT3904.pdf */}
      <transistor
        name="Q1"
        type="npn"
        footprint="sot23"
        manufacturerPartNumber="MMBT3904"
        pinLabels={{ pin1: "base", pin2: "emitter", pin3: "collector" }}
        connections={{
          base: "net.BASE",
          emitter: "net.EMITTER",
          collector: "net.COLLECTOR",
        }}
      />
      <resistor
        name="RB"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={2}
        schX={-4}
        connections={{ pin1: "net.BASE", pin2: "net.GND" }}
      />
      <resistor
        name="RE"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={-2}
        schX={4}
        schY={-2}
        connections={{ pin1: "net.EMITTER", pin2: "net.GND" }}
      />
      <resistor
        name="RC"
        resistance="1k"
        footprint="0402"
        pcbX={4}
        schX={4}
        schY={2}
        connections={{ pin1: "net.COLLECTOR", pin2: "net.GND" }}
      />
      <pcbnotetext text="1 BASE" pcbX={-1.4} pcbY={1.6} fontSize={0.4} />
      <pcbnotetext text="2 EMITTER" pcbX={-1.4} pcbY={-1.6} fontSize={0.4} />
      <pcbnotetext text="3 COLLECTOR" pcbX={1.8} pcbY={0.7} fontSize={0.4} />
      <pcbnotetext text="MMBT3904: 1=B  2=E  3=C" pcbY={3.8} fontSize={0.6} />
    </board>,
  )
  circuit.render()
  const transistor = circuit.selectOne(".Q1") as Transistor
  const pcbComponent = circuit.db.pcb_component
    .list()
    .find((p) => p.source_component_id === transistor.source_component_id)!
  for (const [pin, role, alias] of [
    [1, "base", "b"],
    [2, "emitter", "e"],
    [3, "collector", "c"],
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
    expect(transistor[role]).toBe(transistor.portMap[`pin${pin}`])
    expect(circuit.selectOne(`.Q1 > .${alias}`)).toBe(transistor[role])
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
    const symbol: SchSymbol = symbols.npn_bipolar_transistor_horz!
    const symbolPort = symbol.ports.find((p) => p.labels.includes(role))!
    expect(schematicPort.center.x).toBeCloseTo(symbolPort.x)
    expect(schematicPort.center.y).toBeCloseTo(symbolPort.y)
  }
  const spice = circuitJsonToSpice(circuit.getCircuitJson())
  const transistorSpice = spice.components.find((c) => c.name === "Q1")!
  expect(transistorSpice.nodes).toEqual(
    ["RC", "RB", "RE"].map(
      (name) => spice.components.find((c) => c.name === name)!.nodes[0],
    ),
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
