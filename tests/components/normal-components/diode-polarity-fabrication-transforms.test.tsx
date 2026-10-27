import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("diode fallback polarity follows emitted ports at every rotation on both layers", async () => {
  const { circuit } = getTestFixture()
  const cases = (["top", "bottom"] as const).flatMap((layer, row) =>
    [0, 90, 180, 270].map((rotation, column) => ({
      name: `D_${layer}_${rotation}`,
      layer,
      rotation,
      x: (column - 1.5) * 14,
      y: 7 - row * 14,
    })),
  )
  circuit.add(
    <board width={60} height={30} routingDisabled>
      {cases.map(({ name, layer, rotation, x, y }) => (
        <diode
          key={name}
          name={name}
          layer={layer}
          pcbX={x}
          pcbY={y}
          pcbRotation={rotation}
          footprint="smdpads2_p3.3848mm_pw0.95mm_ph1.15mm"
          pinLabels={{ pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }}
        />
      ))}
      <pcbnotetext
        text="Cathode pin 1: bar and minus; anode pin 2: plus"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const { name, layer } of cases) {
    const source = circuit.db.source_component.getWhere({ name })!
    const pcb = circuit.db.pcb_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const ports = circuit.db.source_port.list({
      source_component_id: source.source_component_id,
    })
    const anode = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((port) => port.name === "anode")!
        .source_port_id,
    })!
    const cathode = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((port) => port.name === "cathode")!
        .source_port_id,
    })!
    const filter = { pcb_component_id: pcb.pcb_component_id }
    const paths = circuit.db.pcb_fabrication_note_path.list(filter)
    const labels = circuit.db.pcb_fabrication_note_text.list(filter)
    expect(paths).toHaveLength(4)
    expect(labels).toHaveLength(2)
    expect([...paths, ...labels].every((note) => note.layer === layer)).toBe(
      true,
    )
    // Emitted terminal positions are the oracle, including bottom-side mirroring.
    for (const [text, terminal] of [
      ["+", anode],
      ["-", cathode],
    ] as const) {
      const label = labels.find((note) => note.text === text)!
      expect(label.anchor_position.x).toBeCloseTo(terminal.x, 6)
      expect(label.anchor_position.y).toBeCloseTo(terminal.y, 6)
    }
    expect(paths[0]!.route[0]!.x).toBeCloseTo(anode.x, 6)
    expect(paths[0]!.route[0]!.y).toBeCloseTo(anode.y, 6)
    expect(paths[3]!.route[1]!.x).toBeCloseTo(cathode.x, 6)
    expect(paths[3]!.route[1]!.y).toBeCloseTo(cathode.y, 6)
    const cathodeBar = paths[2]!.route
    const barX = (cathodeBar[0]!.x + cathodeBar[1]!.x) / 2
    const barY = (cathodeBar[0]!.y + cathodeBar[1]!.y) / 2
    expect(Math.hypot(barX - cathode.x, barY - cathode.y)).toBeLessThan(
      Math.hypot(barX - anode.x, barY - anode.y),
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
