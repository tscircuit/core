import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("LED fabrication symbols follow actual pads at every rotation on both layers", async () => {
  const { circuit } = getTestFixture()
  const cases = (["top", "bottom"] as const).flatMap((layer, row) =>
    [0, 90, 180, 270].map((rotation, col) => ({
      layer,
      rotation,
      name: `LED_${layer}_${rotation}`,
      x: (col - 1.5) * 20,
      y: 8 - row * 16,
    })),
  )
  circuit.add(
    <board width={82} height={36} routingDisabled>
      {cases.map(({ name, layer, rotation, x, y }) => (
        <led
          key={name}
          name={name}
          layer={layer}
          pcbRotation={rotation}
          pcbX={x}
          pcbY={y}
          footprint="0603"
          pinLabels={{ pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }}
          connections={{ anode: "net.VLED", cathode: "net.GND" }}
        />
      ))}
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
    const a = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((p) => p.name === "anode")!.source_port_id,
    })!
    const k = circuit.db.pcb_port.getWhere({
      source_port_id: ports.find((p) => p.name === "cathode")!.source_port_id,
    })!
    const paths = circuit.db.pcb_fabrication_note_path.list({
      pcb_component_id: pcb.pcb_component_id,
    })
    const notes = circuit.db.pcb_fabrication_note_text.list({
      pcb_component_id: pcb.pcb_component_id,
    })
    expect(paths).toHaveLength(4)
    expect(notes).toHaveLength(0)
    expect(paths.every((n) => n.layer === layer)).toBe(true)
    // Compare to emitted ports, not a restatement of core's mirror/rotation.
    expect(paths[0]!.route[0]!.x).toBeCloseTo(a.x)
    expect(paths[0]!.route[0]!.y).toBeCloseTo(a.y)
    expect(paths[3]!.route[1]!.x).toBeCloseTo(k.x)
    expect(paths[3]!.route[1]!.y).toBeCloseTo(k.y)
    const bar = paths[2]!.route
    const bx = (bar[0]!.x + bar[1]!.x) / 2
    const by = (bar[0]!.y + bar[1]!.y) / 2
    expect(Math.hypot(bx - k.x, by - k.y)).toBeLessThan(
      Math.hypot(bx - a.x, by - a.y),
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
