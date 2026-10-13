import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("physical BGA balls preserve source, schematic and PCB identity regardless of ordering", async () => {
  const results = []
  for (const reversed of [false, true]) {
    const { circuit } = getTestFixture()
    const balls = ["A1", "A2", "B1"]
    const entries = [
      ["A1", "DQ0"],
      ["A2", "GND"],
      ["B1", "GND"],
    ] as const
    const pinLabels = Object.fromEntries(
      reversed ? [...entries].reverse() : entries,
    )
    circuit.add(
      <board width={12} height={10} routingDisabled>
        <chip
          name="U1"
          pinLabels={pinLabels}
          schPinArrangement={{ leftSide: ["A1"], rightSide: ["A2", "B1"] }}
          footprint={
            <footprint>
              {(reversed ? [...balls].reverse() : balls).map((ball) => (
                <smtpad
                  portHints={["pin99", pinLabels[ball], ball]}
                  shape="circle"
                  radius={0.2}
                  pcbX={ball === "A2" ? 0.8 : 0}
                  pcbY={ball === "B1" ? -0.8 : 0}
                />
              ))}
            </footprint>
          }
          connections={{ DQ0: "net.DATA", A2: "net.GND", B1: "net.GND" }}
        />
        <pcbnotetext
          text="U1: A1=DQ0; A2 and B1 are separate GND balls"
          pcbY={3}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const db = circuit.db
    const ports = db.source_port.list()
    expect(ports.map((p) => p.name).sort()).toEqual(["A1", "A2", "B1"])
    const dataNet = ports.find(
      (port) => port.name === "A1",
    )!.subcircuit_connectivity_map_key
    const groundNet = ports.find(
      (port) => port.name === "A2",
    )!.subcircuit_connectivity_map_key
    expect(groundNet).toBeDefined()
    expect(
      ports.find((port) => port.name === "B1")!.subcircuit_connectivity_map_key,
    ).toBe(groundNet)
    expect(dataNet).not.toBe(groundNet)
    const identities = ports
      .map((port) => {
        const pcbPort = db.pcb_port
          .list()
          .find((p) => p.source_port_id === port.source_port_id)!
        const pad = db.pcb_smtpad
          .list()
          .find((p) => p.pcb_port_id === pcbPort.pcb_port_id)!
        const schPort = db.schematic_port
          .list()
          .find((p) => p.source_port_id === port.source_port_id)!
        expect(pad.port_hints).toContain(port.name)
        expect(port.pin_number).toBeUndefined()
        expect(schPort.pin_number).toBe(balls.indexOf(port.name) + 1)
        expect(port.port_hints).toContain(pinLabels[port.name])
        if (pad.shape !== "circle")
          throw new Error("Expected a circular ball pad")
        return {
          name: port.name,
          ordinal: schPort.pin_number,
          x: pad.x,
          y: pad.y,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    results.push(identities)
    expect(db.source_trace.list()).toHaveLength(3)
    if (!reversed) {
      expect(circuit).toMatchPcbSnapshot(import.meta.path)
      expect(circuit).toMatchSchematicSnapshot(import.meta.path)
    }
  }
  expect(results[0]).toEqual(results[1])
})
