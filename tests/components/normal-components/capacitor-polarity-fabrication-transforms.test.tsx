import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polarized capacitor signs follow actual pads on both layers and custom footprints", async () => {
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
          footprint={reversed ? undefined : "1206"}
          layer={layer}
          pcbRotation={rotation}
          pcbX={x}
          pcbY={y}
        >
          {reversed && (
            <footprint>
              <smtpad
                shape="rect"
                width={1}
                height={1.5}
                pcbX={1.5}
                portHints={["1", "pos"]}
              />
              <smtpad
                shape="rect"
                width={1}
                height={1.5}
                pcbX={-1.5}
                portHints={["2", "neg"]}
              />
            </footprint>
          )}
        </capacitor>
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
    expect(paths.every((p) => p.layer === layer)).toBe(true)
    // Compare sign centers with emitted ports rather than reconstructing a mirror.
    for (const [path, target, other] of [
      [paths[0]!, positive, negative],
      [paths[2]!, negative, positive],
    ] as const) {
      const center = {
        x: (path.route[0]!.x + path.route[1]!.x) / 2,
        y: (path.route[0]!.y + path.route[1]!.y) / 2,
      }
      expect(Math.hypot(center.x - target.x, center.y - target.y)).toBeLessThan(
        Math.hypot(center.x - other.x, center.y - other.y),
      )
    }
    const dx = negative.x - positive.x,
      dy = negative.y - positive.y
    const lengthSquared = dx * dx + dy * dy
    for (const path of paths)
      for (const point of path.route) {
        const projection =
          ((point.x - positive.x) * dx + (point.y - positive.y) * dy) /
          lengthSquared
        expect(projection).toBeGreaterThan(0)
        expect(projection).toBeLessThan(1)
      }
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
