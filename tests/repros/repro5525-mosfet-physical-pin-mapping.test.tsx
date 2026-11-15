import { expect, it } from "bun:test"
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

  const sourcePorts = circuit.db.source_port.list()
  const portName = (pinNumber: number) =>
    sourcePorts.find(
      (p) =>
        p.pin_number === pinNumber &&
        p.source_component_id ===
          sourcePorts.find((q) => q.name === "gate")!.source_component_id,
    )!.name
  expect([1, 2, 3].map(portName)).toEqual(["gate", "source", "drain"])

  const gate = sourcePorts.find((p) => p.name === "gate")!
  const trace = circuit.db.source_trace.list()[0]!
  expect(trace.connected_source_port_ids).toContain(gate.source_port_id)

  const schematicPort = (name: string) => {
    const sourcePort = sourcePorts.find((p) => p.name === name)!
    return circuit.db.schematic_port
      .list()
      .find((p) => p.source_port_id === sourcePort.source_port_id)!
  }
  expect(schematicPort("gate").facing_direction).toBe("left")
  expect(schematicPort("source").facing_direction).toBe("down")
  expect(schematicPort("drain").facing_direction).toBe("up")

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
