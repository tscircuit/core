import { expect, it } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("maps AO3400A SOT-23 pads to G/S/D without moving the schematic terminals", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={10} routingDisabled>
      {/* Alpha & Omega AO3400A datasheet, page 1: 1=G, 2=S, 3=D. */}
      <mosfet
        name="Q1"
        channelType="n"
        mosfetMode="enhancement"
        footprint="sot23"
        manufacturerPartNumber="AO3400A"
        pinLabels={{ pin1: "gate", pin2: "source", pin3: "drain" }}
      />
      <resistor name="RG" resistance="100" footprint="0402" pcbX={-5} />
      <trace from=".Q1 > .gate" to=".RG > .pin1" />
      <pcbnotetext text="1 G" pcbX={-1.9} pcbY={1.6} fontSize={0.4} />
      <pcbnotetext text="2 S" pcbX={-1.9} pcbY={-1.6} fontSize={0.4} />
      <pcbnotetext text="3 D" pcbX={1.9} pcbY={0.7} fontSize={0.4} />
      <pcbnotetext text="AO3400A: 1=G  2=S  3=D" pcbY={3.8} fontSize={0.6} />
    </board>,
  )
  circuit.render()

  const q1 = circuit.selectOne(".Q1")!
  const sideByRole = { gate: "left", source: "down", drain: "up" } as const
  for (const [pin, role] of [
    [1, "gate"],
    [2, "source"],
    [3, "drain"],
  ] as const) {
    const pad = circuit.db.pcb_smtpad
      .list()
      .find(
        (p) =>
          p.pcb_component_id === q1.pcb_component_id &&
          p.port_hints?.includes(String(pin)),
      )!
    const pcbPort = circuit.db.pcb_port.get(pad.pcb_port_id!)!
    const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id!)!
    expect(sourcePort.name).toBe(role)
    const schematicPort = circuit.db.schematic_port
      .list()
      .find((p) => p.source_port_id === sourcePort.source_port_id)!
    expect(schematicPort.facing_direction).toBe(sideByRole[role])
  }

  const gate = circuit.selectOne(".Q1 > .gate") as Port
  expect(
    circuit.db.source_trace.list()[0]!.connected_source_port_ids,
  ).toContain(gate.source_port_id!)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
