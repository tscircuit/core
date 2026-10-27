import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("LED footprint polarity artwork follows both mappings at every rotation on both sides", async () => {
  const { circuit } = getTestFixture()
  const cases = ([1, 2] as const).flatMap((anodePin, pinRow) =>
    (["top", "bottom"] as const).flatMap((layer, sideRow) =>
      [0, 90, 180, 270].map((rotation, col) => ({
        name: `LED_A${anodePin}_${layer}_${rotation}`,
        anodePin,
        layer,
        rotation,
        x: (col - 1.5) * 15,
        y: 18 - (pinRow * 2 + sideRow) * 12,
      })),
    ),
  )
  circuit.add(
    <board width={66} height={55} routingDisabled>
      {cases.map((c) => (
        <led
          key={c.name}
          name={c.name}
          footprint="smdpads2_p2.4mm_pw0.8mm_ph0.8mm"
          pinLabels={
            c.anodePin === 1
              ? { pin1: ["anode"], pin2: ["cathode"] }
              : { pin1: ["cathode"], pin2: ["anode"] }
          }
          layer={c.layer}
          pcbRotation={c.rotation}
          pcbX={c.x}
          pcbY={c.y}
        />
      ))}
      <pcbnotetext
        text="One symbol per LED: plus at anode; cathode bar and minus at cathode"
        pcbY={-25}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const c of cases) {
    const source = circuit.db.source_component.getWhere({ name: c.name })!
    const pcb = circuit.db.pcb_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const ports = circuit.db.source_port.list({
      source_component_id: source.source_component_id,
    })
    const a = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((p) => p.name === "anode")!.source_port_id,
    })!
    const k = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((p) => p.name === "cathode")!.source_port_id,
    })!
    const filter = { pcb_component_id: pcb.pcb_component_id }
    const paths = circuit.db.pcb_fabrication_note_path.list(filter)
    const labels = circuit.db.pcb_fabrication_note_text.list(filter)
    expect(paths).toHaveLength(4)
    expect(labels).toHaveLength(2)
    expect([...paths, ...labels].every((n) => n.layer === c.layer)).toBe(true)
    expect([...paths, ...labels].every((n) => n.is_polarity_marking)).toBe(true)
    const center = { x: (a.x + k.x) / 2, y: (a.y + k.y) / 2 }
    for (const [sign, port] of [
      ["+", a],
      ["-", k],
    ] as const) {
      const label = labels.find((n) => n.text === sign)!
      expect(
        (label.anchor_position.x - center.x) * (port.x - center.x) +
          (label.anchor_position.y - center.y) * (port.y - center.y),
      ).toBeGreaterThan(0)
    }
    const bar = paths[2]!.route
    const mid = {
      x: (bar[0]!.x + bar[1]!.x) / 2,
      y: (bar[0]!.y + bar[1]!.y) / 2,
    }
    expect(Math.hypot(mid.x - k.x, mid.y - k.y)).toBeLessThan(
      Math.hypot(mid.x - a.x, mid.y - a.y),
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
