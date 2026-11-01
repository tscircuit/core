import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor fabrication marks follow both terminal mappings, rotations and board sides", async () => {
  const { circuit } = getTestFixture()
  const cases = [false, true].flatMap((reversed, mapping) =>
    (["top", "bottom"] as const).flatMap((layer, side) =>
      [0, 90, 180, 270].map((rotation, col) => ({
        name: `C_${reversed ? "REV" : "STD"}_${layer}_${rotation}`,
        reversed,
        layer,
        rotation,
        x: (col - 1.5) * 10,
        y: 12 - (mapping * 2 + side) * 8,
      })),
    ),
  )
  circuit.add(
    <board width={42} height={34} routingDisabled>
      {cases.map(({ name, reversed, layer, rotation, x, y }) => (
        <capacitor
          key={name}
          name={name}
          capacitance="10uF"
          polarized
          footprint={reversed ? "1206_positivepin2_negativepin1" : "1206"}
          layer={layer}
          pcbRotation={rotation}
          pcbX={x}
          pcbY={y}
        />
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_fabrication_note_text.list()).toHaveLength(0)
  for (const { name, layer } of cases) {
    const source = circuit.db.source_component.getWhere({ name })!
    const pcb = circuit.db.pcb_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const ports = circuit.db.source_port.list({
      source_component_id: source.source_component_id,
    })
    const positiveSource = ports.find(
      (p) => p.name === "pos" || p.port_hints?.includes("pos"),
    )!
    const negativeSource = ports.find(
      (p) => p.name === "neg" || p.port_hints?.includes("neg"),
    )!
    const positive = circuit.db.pcb_port.getWhere({
      source_port_id: positiveSource.source_port_id,
    })!
    const negative = circuit.db.pcb_port.getWhere({
      source_port_id: negativeSource.source_port_id,
    })!
    const paths = circuit.db.pcb_fabrication_note_path.list({
      pcb_component_id: pcb.pcb_component_id,
    })
    expect(paths).toHaveLength(3)
    for (const path of paths) {
      expect(path.layer).toBe(layer)
      expect(path.route).toHaveLength(2)
    }
    const plus = paths.filter(
      (path) =>
        Math.hypot(
          (path.route[0]!.x + path.route[1]!.x) / 2 - positive.x,
          (path.route[0]!.y + path.route[1]!.y) / 2 - positive.y,
        ) < 1e-6,
    )
    expect(plus).toHaveLength(2)
    const plusDirections = plus.map((path) => ({
      x: path.route[1]!.x - path.route[0]!.x,
      y: path.route[1]!.y - path.route[0]!.y,
    }))
    expect(
      plusDirections[0]!.x * plusDirections[1]!.x +
        plusDirections[0]!.y * plusDirections[1]!.y,
    ).toBeCloseTo(0)
    const minus = paths.find((path) => !plus.includes(path))!
    expect((minus.route[0]!.x + minus.route[1]!.x) / 2).toBeCloseTo(negative.x)
    expect((minus.route[0]!.y + minus.route[1]!.y) / 2).toBeCloseTo(negative.y)
    const mark = {
      x: minus.route[1]!.x - minus.route[0]!.x,
      y: minus.route[1]!.y - minus.route[0]!.y,
    }
    const terminals = { x: positive.x - negative.x, y: positive.y - negative.y }
    expect(mark.x * terminals.y - mark.y * terminals.x).toBeCloseTo(0)
    const pads = circuit.db.pcb_smtpad.list({
      pcb_component_id: pcb.pcb_component_id,
    })
    for (const port of [positive, negative]) {
      const pad = pads.find((pad) => pad.pcb_port_id === port.pcb_port_id)!
      expect("x" in pad ? pad.x : undefined).toBeCloseTo(port.x)
      expect("y" in pad ? pad.y : undefined).toBeCloseTo(port.y)
    }
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
